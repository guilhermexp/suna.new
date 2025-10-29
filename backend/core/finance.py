import os
import json
from datetime import date, datetime
from typing import Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from core.api_models.finance import (
    FinanceAccountResponse,
    FinanceSummaryCrypto,
    FinanceSummaryResponse,
    FinanceSummaryVariation,
    FinanceTransactionResponse,
    FinanceTransactionCreateRequest,
    FinanceTransactionUpdateRequest,
    FinancePendingPaymentResponse,
    FinancePendingPaymentCreateRequest,
    FinancePendingPaymentUpdateRequest,
    FinanceSubscriptionResponse,
    FinanceSubscriptionCreateRequest,
    FinanceSubscriptionUpdateRequest,
    FinanceMarkPendingRequest,
)
from core.services.supabase import DBConnection
from core.utils.auth_utils import verify_and_get_user_id_from_jwt
from core.utils.config import config
from core.utils.logger import logger

router = APIRouter(prefix="/finance", tags=["finance"])

DEFAULT_MODEL = os.getenv("GEMINI_FINANCE_MODEL", "gemini-2.0-flash-exp")
SYSTEM_PROMPT = (
    "Você é um parser financeiro que transforma descrições em linguagem natural em JSON estruturado."
    " Algumas instruções criam transações, outras gerenciam pendências e também assinaturas recorrentes.\n\n"
    "Regras gerais:\n"
    "- Sempre responda apenas com JSON válido, sem texto adicional.\n"
    "- Identifique corretamente o tipo de registro: TRANSACTION, PENDING ou SUBSCRIPTION.\n"
    "- Valores devem ser números positivos (use ponto como separador decimal). Interprete moeda a partir do texto (padrão BRL).\n"
    "- IMPORTANTE: Se o texto não mencionar um VALOR numérico explícito, retorne amount como 0 e adicione uma nota em 'notes' pedindo o valor.\n"
    "- Datas devem utilizar ISO 8601 (YYYY-MM-DD). Quando ausência, deixe string vazia.\n"
    "- Para textos que pedem para cancelar/pausar/retomar uma assinatura existente, retornar SUBSCRIPTION com a ação apropriada e informar o identificador.\n"
    "- Para novas assinaturas, preencher os campos relevantes com valores inferidos.\n"
    "- Palavras-chave para SUBSCRIPTION: 'todo mês', 'mensalidade', 'assinatura', 'recorrente', 'todo dia X', 'sempre dia X'.\n"
    "- Para TRANSACTION: eventos únicos como 'recebi', 'paguei', 'comprei' sem indicação de recorrência.\n"
    "- Para PENDING: 'vence', 'pendente', 'a pagar', 'a receber' com data futura.\n\n"
    "Estrutura esperada:\n"
    "{\n"
    "  \"entryType\": \"transaction\" | \"pending\" | \"subscription\",\n"
    "  \"transaction\": {\n"
    "    \"type\": \"INCOME\" | \"EXPENSE\",\n"
    "    \"amount\": number,\n"
    "    \"currency\": \"USD\" | \"BRL\" | \"EUR\" | ...,\n"
    "    \"description\": string,\n"
    "    \"category\": string,\n"
    "    \"date\": \"YYYY-MM-DD\",\n"
    "    \"counterparty\": string,\n"
    "    \"notes\": string,\n"
    "    \"tags\": string[]\n"
    "  },\n"
    "  \"pending\": {\n"
    "    \"amount\": number,\n"
    "    \"currency\": \"USD\" | \"BRL\" | \"EUR\" | ...,\n"
    "    \"description\": string,\n"
    "    \"dueDate\": \"YYYY-MM-DD\",\n"
    "    \"priority\": \"LOW\" | \"MEDIUM\" | \"HIGH\",\n"
    "    \"recurrence\": \"ONCE\" | \"WEEKLY\" | \"MONTHLY\" | \"YEARLY\",\n"
    "    \"counterparty\": string,\n"
    "    \"notes\": string\n"
    "  },\n"
    "  \"subscription\": {\n"
    "    \"action\": \"create\" | \"pause\" | \"cancel\" | \"resume\",\n"
    "    \"serviceName\": string,\n"
    "    \"amount\": number,\n"
    "    \"currency\": \"USD\" | \"BRL\" | ..., \n"
    "    \"billingDay\": number,\n"
    "    \"category\": string,\n"
    "    \"status\": \"ACTIVE\" | \"PAUSED\" | \"CANCELLED\",\n"
    "    \"notes\": string,\n"
    "    \"id\": string\n"
    "  },\n"
    "  \"raw\": string\n"
    "}\n\n"
    "Inclua somente o objeto correspondente ao entryType. O campo \"raw\" deve trazer o texto interpretado após normalização.\n"
)


class InterpretRequest(BaseModel):
    input: str


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _to_float(value) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value))
    except (ValueError, TypeError):
        return 0.0


def _to_date(value) -> date:
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00')).date()
        except ValueError:
            pass
    return date.today()


def _to_datetime(value) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            pass
    return datetime.utcnow()


def _normalise_tags(value) -> List[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    return []


async def _get_supabase_client():
    db = DBConnection()
    return await db.client


async def _resolve_account_id(client, user_id: str, requested_account_id: Optional[str]) -> str:
    """Resolve the Basejump account ID for the current user."""
    if requested_account_id:
        membership = await client.schema('basejump').table('account_user') \
            .select('account_id') \
            .eq('account_id', requested_account_id) \
            .eq('user_id', user_id) \
            .limit(1) \
            .execute()
        if membership.data:
            return requested_account_id
        raise HTTPException(status_code=403, detail="Você não tem acesso a esta conta financeira.")

    # Try personal account owned by user
    personal = await client.schema('basejump').table('accounts') \
        .select('id') \
        .eq('primary_owner_user_id', user_id) \
        .eq('personal_account', True) \
        .limit(1) \
        .execute()
    if personal.data:
        return personal.data[0]['id']

    # Fallback to first membership
    membership = await client.schema('basejump').table('account_user') \
        .select('account_id') \
        .eq('user_id', user_id) \
        .limit(1) \
        .execute()
    if membership.data:
        return membership.data[0]['account_id']

    raise HTTPException(status_code=404, detail="Nenhuma conta disponível para este usuário.")


async def _ensure_default_finance_accounts(client, account_id: str, user_id: str) -> None:
    existing = await client.table('finance_accounts').select('id').eq('account_id', account_id).limit(1).execute()
    if existing.data:
        return

    default_accounts = [
        {
            "name": "Funding",
            "account_type": "FUNDING",
            "currency": "BRL",
            "opening_balance": 0,
            "color": "#ec4899",
        },
        {
            "name": "Unified Trading",
            "account_type": "TRADING",
            "currency": "BRL",
            "opening_balance": 0,
            "color": "#6366f1",
        },
        {
            "name": "Savings",
            "account_type": "SAVINGS",
            "currency": "BRL",
            "opening_balance": 0,
            "color": "#0ea5e9",
        },
    ]

    payload = [
        {
            **account,
            "account_id": account_id,
            "created_by": user_id,
        }
        for account in default_accounts
    ]

    await client.table('finance_accounts').insert(payload).execute()


async def _fetch_finance_account(client, account_id: str, finance_account_id: str) -> Dict:
    result = await client.table('finance_accounts') \
        .select('*') \
        .eq('id', finance_account_id) \
        .eq('account_id', account_id) \
        .maybe_single() \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Conta financeira não encontrada.")
    return result.data


def _map_account(row: Dict, balance: float) -> FinanceAccountResponse:
    return FinanceAccountResponse(
        id=row['id'],
        name=row.get('name') or 'Conta',
        account_type=row.get('account_type', 'OTHER'),
        currency=row.get('currency', 'BRL'),
        balance=balance,
        color=row.get('color'),
    )


def _map_transaction(row: Dict) -> FinanceTransactionResponse:
    return FinanceTransactionResponse(
        id=row['id'],
        accountId=row.get('account_id'),
        financeAccountId=row.get('finance_account_id'),
        createdBy=row.get('created_by'),
        type=row.get('type', 'EXPENSE'),
        status=row.get('status', 'COMPLETED'),
        description=row.get('description'),
        category=row.get('category'),
        amount=_to_float(row.get('amount')),
        currency=row.get('currency', 'BRL'),
        date=_to_date(row.get('transaction_date')),
        counterparty=row.get('counterparty'),
        notes=row.get('notes'),
        tags=_normalise_tags(row.get('tags')),
        metadata=row.get('metadata') or {},
        createdAt=_to_datetime(row.get('created_at')),
        updatedAt=_to_datetime(row.get('updated_at')),
    )


def _map_pending(row: Dict) -> FinancePendingPaymentResponse:
    return FinancePendingPaymentResponse(
        id=row['id'],
        accountId=row.get('account_id'),
        financeAccountId=row.get('finance_account_id'),
        createdBy=row.get('created_by'),
        description=row.get('description', ''),
        amount=_to_float(row.get('amount')),
        currency=row.get('currency', 'BRL'),
        dueDate=_to_date(row.get('due_date')),
        recurrence=row.get('recurrence', 'ONCE'),
        priority=row.get('priority', 'MEDIUM'),
        status=row.get('status', 'PENDING'),
        category=row.get('category'),
        counterparty=row.get('counterparty'),
        notes=row.get('notes'),
        metadata=row.get('metadata') or {},
        createdAt=_to_datetime(row.get('created_at')),
        updatedAt=_to_datetime(row.get('updated_at')),
        paidAt=_to_datetime(row.get('paid_at')) if row.get('paid_at') else None,
    )


def _map_subscription(row: Dict) -> FinanceSubscriptionResponse:
    return FinanceSubscriptionResponse(
        id=row['id'],
        accountId=row.get('account_id'),
        financeAccountId=row.get('finance_account_id'),
        createdBy=row.get('created_by'),
        serviceName=row.get('service_name', ''),
        amount=_to_float(row.get('amount')),
        currency=row.get('currency', 'BRL'),
        billingDay=int(row.get('billing_day', 1)),
        category=row.get('category'),
        status=row.get('status', 'ACTIVE'),
        startDate=_to_date(row.get('start_date')),
        nextBilling=_to_date(row.get('next_billing')) if row.get('next_billing') else None,
        notes=row.get('notes'),
        metadata=row.get('metadata') or {},
        createdAt=_to_datetime(row.get('created_at')),
        updatedAt=_to_datetime(row.get('updated_at')),
    )


async def _calculate_account_balances(client, account_id: str, accounts: List[Dict]) -> List[FinanceAccountResponse]:
    transactions = await client.table('finance_transactions') \
        .select('finance_account_id, type, amount') \
        .eq('account_id', account_id) \
        .execute()

    totals: Dict[str, float] = {}
    for acc in accounts:
        totals[acc['id']] = _to_float(acc.get('opening_balance'))

    if transactions.data:
        for row in transactions.data:
            fa_id = row.get('finance_account_id')
            if fa_id not in totals:
                totals[fa_id] = 0.0
            amount = _to_float(row.get('amount'))
            if row.get('type') == 'INCOME':
                totals[fa_id] += amount
            else:
                totals[fa_id] -= amount

    return [_map_account(acc, totals.get(acc['id'], 0.0)) for acc in accounts]


# ---------------------------------------------------------------------------
# Finance data endpoints
# ---------------------------------------------------------------------------

@router.get('/summary', response_model=FinanceSummaryResponse)
async def get_finance_summary(
    account_id: Optional[str] = Query(None, alias='accountId'),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)
    await _ensure_default_finance_accounts(client, resolved_account_id, user_id)

    accounts_result = await client.table('finance_accounts') \
        .select('*') \
        .eq('account_id', resolved_account_id) \
        .order('created_at') \
        .execute()

    account_rows = accounts_result.data or []
    finance_accounts = await _calculate_account_balances(client, resolved_account_id, account_rows)

    total_balance = sum(account.balance for account in finance_accounts)
    currency = finance_accounts[0].currency if finance_accounts else 'BRL'

    summary = FinanceSummaryResponse(
        totalBalance=total_balance,
        currency=currency,
        accounts=finance_accounts,
        variation=FinanceSummaryVariation(),
        lastUpdated=datetime.utcnow(),
        cryptoEquivalent=None,
    )
    return summary


@router.get('/accounts', response_model=List[FinanceAccountResponse])
async def get_finance_accounts(
    account_id: Optional[str] = Query(None, alias='accountId'),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)
    await _ensure_default_finance_accounts(client, resolved_account_id, user_id)

    accounts_result = await client.table('finance_accounts') \
        .select('*') \
        .eq('account_id', resolved_account_id) \
        .order('created_at') \
        .execute()

    account_rows = accounts_result.data or []
    return await _calculate_account_balances(client, resolved_account_id, account_rows)


@router.get('/transactions', response_model=List[FinanceTransactionResponse])
async def list_finance_transactions(
    account_id: Optional[str] = Query(None, alias='accountId'),
    txn_type: Optional[str] = Query(None, alias='type'),
    status: Optional[str] = None,
    start_date: Optional[date] = Query(None, alias='startDate'),
    end_date: Optional[date] = Query(None, alias='endDate'),
    category: Optional[str] = None,
    tags: Optional[str] = None,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)

    query = client.table('finance_transactions') \
        .select('*') \
        .eq('account_id', resolved_account_id) \
        .order('transaction_date', desc=True) \
        .order('created_at', desc=True)

    if txn_type:
        query = query.eq('type', txn_type.upper())
    if status:
        query = query.eq('status', status.upper())
    if start_date:
        query = query.gte('transaction_date', start_date.isoformat())
    if end_date:
        query = query.lte('transaction_date', end_date.isoformat())
    if category:
        query = query.ilike('category', f"%{category}%")
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        for tag in tag_list:
            query = query.contains('tags', [tag])

    result = await query.execute()
    rows = result.data or []
    return [_map_transaction(row) for row in rows]


@router.post('/transactions', response_model=FinanceTransactionResponse)
async def create_finance_transaction(
    payload: FinanceTransactionCreateRequest,
    account_id: Optional[str] = Query(None, alias='accountId'),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)
    finance_account = await _fetch_finance_account(client, resolved_account_id, payload.accountId)

    record = {
        "account_id": resolved_account_id,
        "finance_account_id": payload.accountId,
        "created_by": user_id,
        "type": payload.type,
        "status": payload.status,
        "description": payload.description,
        "category": payload.category,
        "amount": payload.amount,
        "currency": payload.currency or finance_account.get('currency', 'BRL'),
        "transaction_date": payload.date.isoformat(),
        "counterparty": payload.counterparty,
        "notes": payload.notes,
        "tags": payload.tags,
    }

    result = await client.table('finance_transactions').insert(record).select('*').limit(1).single().execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Não foi possível criar a transação.")

    return _map_transaction(result.data)


@router.put('/transactions/{transaction_id}', response_model=FinanceTransactionResponse)
async def update_finance_transaction(
    transaction_id: str,
    payload: FinanceTransactionUpdateRequest,
    account_id: Optional[str] = Query(None, alias='accountId'),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)

    update_data: Dict[str, object] = {}
    if payload.description is not None:
        update_data['description'] = payload.description
    if payload.category is not None:
        update_data['category'] = payload.category
    if payload.amount is not None:
        update_data['amount'] = payload.amount
    if payload.currency is not None:
        update_data['currency'] = payload.currency
    if payload.date is not None:
        update_data['transaction_date'] = payload.date.isoformat()
    if payload.status is not None:
        update_data['status'] = payload.status
    if payload.counterparty is not None:
        update_data['counterparty'] = payload.counterparty
    if payload.notes is not None:
        update_data['notes'] = payload.notes
    if payload.tags is not None:
        update_data['tags'] = payload.tags

    if not update_data:
        result = await client.table('finance_transactions').select('*').eq('id', transaction_id).eq('account_id', resolved_account_id).maybe_single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Transação não encontrada.")
        return _map_transaction(result.data)

    result = await client.table('finance_transactions') \
        .update(update_data) \
        .eq('id', transaction_id) \
        .eq('account_id', resolved_account_id) \
        .select('*') \
        .maybe_single() \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Transação não encontrada.")

    return _map_transaction(result.data)


@router.delete('/transactions/{transaction_id}')
async def delete_finance_transaction(
    transaction_id: str,
    account_id: Optional[str] = Query(None, alias='accountId'),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)

    await client.table('finance_transactions').delete().eq('id', transaction_id).eq('account_id', resolved_account_id).execute()
    return {"message": "Transação removida."}


@router.get('/pendings', response_model=List[FinancePendingPaymentResponse])
async def list_finance_pendings(
    account_id: Optional[str] = Query(None, alias='accountId'),
    status: Optional[str] = None,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)

    query = client.table('finance_pending_payments') \
        .select('*') \
        .eq('account_id', resolved_account_id) \
        .order('due_date')

    if status:
        query = query.eq('status', status.upper())

    result = await query.execute()
    rows = result.data or []
    return [_map_pending(row) for row in rows]


@router.post('/pendings', response_model=FinancePendingPaymentResponse)
async def create_finance_pending(
    payload: FinancePendingPaymentCreateRequest,
    account_id: Optional[str] = Query(None, alias='accountId'),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)
    await _fetch_finance_account(client, resolved_account_id, payload.accountId)

    record = {
        "account_id": resolved_account_id,
        "finance_account_id": payload.accountId,
        "created_by": user_id,
        "description": payload.description,
        "amount": payload.amount,
        "currency": payload.currency,
        "due_date": payload.dueDate.isoformat(),
        "recurrence": payload.recurrence,
        "priority": payload.priority,
        "status": payload.status,
        "category": payload.category,
        "counterparty": payload.counterparty,
        "notes": payload.notes,
    }

    result = await client.table('finance_pending_payments').insert(record).select('*').limit(1).single().execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Não foi possível criar a pendência.")

    return _map_pending(result.data)


@router.put('/pendings/{pending_id}', response_model=FinancePendingPaymentResponse)
async def update_finance_pending(
    pending_id: str,
    payload: FinancePendingPaymentUpdateRequest,
    account_id: Optional[str] = Query(None, alias='accountId'),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)

    update_data: Dict[str, object] = {}
    if payload.description is not None:
        update_data['description'] = payload.description
    if payload.amount is not None:
        update_data['amount'] = payload.amount
    if payload.currency is not None:
        update_data['currency'] = payload.currency
    if payload.dueDate is not None:
        update_data['due_date'] = payload.dueDate.isoformat()
    if payload.recurrence is not None:
        update_data['recurrence'] = payload.recurrence
    if payload.priority is not None:
        update_data['priority'] = payload.priority
    if payload.status is not None:
        update_data['status'] = payload.status
    if payload.category is not None:
        update_data['category'] = payload.category
    if payload.counterparty is not None:
        update_data['counterparty'] = payload.counterparty
    if payload.notes is not None:
        update_data['notes'] = payload.notes

    if not update_data:
        result = await client.table('finance_pending_payments').select('*').eq('id', pending_id).eq('account_id', resolved_account_id).maybe_single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Pendência não encontrada.")
        return _map_pending(result.data)

    result = await client.table('finance_pending_payments') \
        .update(update_data) \
        .eq('id', pending_id) \
        .eq('account_id', resolved_account_id) \
        .select('*') \
        .maybe_single() \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Pendência não encontrada.")

    return _map_pending(result.data)


@router.post('/pendings/{pending_id}/mark', response_model=FinancePendingPaymentResponse)
async def mark_finance_pending(
    pending_id: str,
    payload: FinanceMarkPendingRequest,
    account_id: Optional[str] = Query(None, alias='accountId'),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)

    update_data: Dict[str, object] = {
        'status': payload.status,
        'paid_at': datetime.utcnow().isoformat() if payload.status == 'PAID' else None,
    }

    result = await client.table('finance_pending_payments') \
        .update(update_data) \
        .eq('id', pending_id) \
        .eq('account_id', resolved_account_id) \
        .select('*') \
        .maybe_single() \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Pendência não encontrada.")

    return _map_pending(result.data)


@router.delete('/pendings/{pending_id}')
async def delete_finance_pending(
    pending_id: str,
    account_id: Optional[str] = Query(None, alias='accountId'),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)

    await client.table('finance_pending_payments').delete().eq('id', pending_id).eq('account_id', resolved_account_id).execute()
    return {"message": "Pendência removida."}


@router.get('/subscriptions', response_model=List[FinanceSubscriptionResponse])
async def list_finance_subscriptions(
    account_id: Optional[str] = Query(None, alias='accountId'),
    status: Optional[str] = None,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)

    query = client.table('finance_subscriptions') \
        .select('*') \
        .eq('account_id', resolved_account_id) \
        .order('billing_day')

    if status:
        query = query.eq('status', status.upper())

    result = await query.execute()
    rows = result.data or []
    return [_map_subscription(row) for row in rows]


@router.post('/subscriptions', response_model=FinanceSubscriptionResponse)
async def create_finance_subscription(
    payload: FinanceSubscriptionCreateRequest,
    account_id: Optional[str] = Query(None, alias='accountId'),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)
    await _fetch_finance_account(client, resolved_account_id, payload.accountId)

    record = {
        "account_id": resolved_account_id,
        "finance_account_id": payload.accountId,
        "created_by": user_id,
        "service_name": payload.serviceName,
        "amount": payload.amount,
        "currency": payload.currency,
        "billing_day": payload.billingDay,
        "category": payload.category,
        "status": payload.status,
        "start_date": payload.startDate.isoformat(),
        "next_billing": payload.nextBilling.isoformat() if payload.nextBilling else None,
        "notes": payload.notes,
    }

    result = await client.table('finance_subscriptions').insert(record).select('*').limit(1).single().execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Não foi possível criar a assinatura.")

    return _map_subscription(result.data)


@router.put('/subscriptions/{subscription_id}', response_model=FinanceSubscriptionResponse)
async def update_finance_subscription(
    subscription_id: str,
    payload: FinanceSubscriptionUpdateRequest,
    account_id: Optional[str] = Query(None, alias='accountId'),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)

    update_data: Dict[str, object] = {}
    if payload.serviceName is not None:
        update_data['service_name'] = payload.serviceName
    if payload.amount is not None:
        update_data['amount'] = payload.amount
    if payload.currency is not None:
        update_data['currency'] = payload.currency
    if payload.billingDay is not None:
        update_data['billing_day'] = payload.billingDay
    if payload.category is not None:
        update_data['category'] = payload.category
    if payload.status is not None:
        update_data['status'] = payload.status
    if payload.startDate is not None:
        update_data['start_date'] = payload.startDate.isoformat()
    if payload.nextBilling is not None:
        update_data['next_billing'] = payload.nextBilling.isoformat()
    if payload.notes is not None:
        update_data['notes'] = payload.notes

    if not update_data:
        result = await client.table('finance_subscriptions').select('*').eq('id', subscription_id).eq('account_id', resolved_account_id).maybe_single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Assinatura não encontrada.")
        return _map_subscription(result.data)

    result = await client.table('finance_subscriptions') \
        .update(update_data) \
        .eq('id', subscription_id) \
        .eq('account_id', resolved_account_id) \
        .select('*') \
        .maybe_single() \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada.")

    return _map_subscription(result.data)


@router.delete('/subscriptions/{subscription_id}')
async def delete_finance_subscription(
    subscription_id: str,
    account_id: Optional[str] = Query(None, alias='accountId'),
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    client = await _get_supabase_client()
    resolved_account_id = await _resolve_account_id(client, user_id, account_id)

    await client.table('finance_subscriptions').delete().eq('id', subscription_id).eq('account_id', resolved_account_id).execute()
    return {"message": "Assinatura removida."}


# ---------------------------------------------------------------------------
# AI Interpretation Endpoint (existing functionality)
# ---------------------------------------------------------------------------

@router.post("/interpret")
async def interpret_finance(
    request: InterpretRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt),
):
    user_input = request.input.strip()
    if not user_input:
        raise HTTPException(status_code=400, detail="Texto para interpretação é obrigatório.")

    api_key = config.GEMINI_API_KEY or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.error("Gemini API key is not configured")
        raise HTTPException(status_code=500, detail="Gemini API key não configurada no servidor.")

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{DEFAULT_MODEL}:generateContent"
        f"?key={api_key}"
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": SYSTEM_PROMPT},
                    {"text": f"Texto do usuário: \"\"\"{user_input}\"\"\""},
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0,
            "response_mime_type": "application/json",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.json().get("error", {}).get("message") if exc.response else str(exc)
        logger.error(f"Gemini interpret request failed: {detail}")
        raise HTTPException(status_code=exc.response.status_code if exc.response else 502, detail=detail)
    except httpx.HTTPError as exc:
        logger.error(f"HTTP error contacting Gemini interpret API: {exc}")
        raise HTTPException(status_code=502, detail="Falha ao consultar o modelo Gemini.")

    data = response.json()
    text_part = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text")
    )

    if not text_part:
        logger.error(f"Unexpected response from Gemini interpret API: {data}")
        raise HTTPException(status_code=502, detail="Resposta inválida do modelo Gemini.")

    try:
        parsed = json.loads(text_part)
    except json.JSONDecodeError:
        logger.error(f"Gemini returned non-JSON payload: {text_part}")
        raise HTTPException(status_code=502, detail="Não foi possível interpretar a resposta do modelo.")

    return parsed
