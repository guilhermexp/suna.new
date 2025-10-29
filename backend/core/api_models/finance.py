from __future__ import annotations

from datetime import date, datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class FinanceAccountResponse(BaseModel):
    id: str
    name: str
    account_type: Literal['FUNDING', 'TRADING', 'SAVINGS', 'CHECKING', 'CREDIT', 'CASH', 'OTHER']
    currency: str
    balance: float
    color: Optional[str] = None


class FinanceSummaryVariation(BaseModel):
    amount: float = 0.0
    percentage: float = 0.0
    period: Literal['DAILY', 'WEEKLY', 'MONTHLY'] = 'MONTHLY'


class FinanceSummaryCrypto(BaseModel):
    symbol: str
    amount: float


class FinanceSummaryResponse(BaseModel):
    totalBalance: float
    currency: str
    accounts: List[FinanceAccountResponse]
    variation: FinanceSummaryVariation
    lastUpdated: datetime
    cryptoEquivalent: Optional[FinanceSummaryCrypto] = None


class FinanceTransactionResponse(BaseModel):
    id: str
    accountId: str
    financeAccountId: str
    createdBy: str
    type: Literal['INCOME', 'EXPENSE']
    status: Literal['COMPLETED', 'PENDING', 'CANCELLED']
    description: Optional[str] = None
    category: Optional[str] = None
    amount: float
    currency: str
    date: date
    counterparty: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str]
    metadata: dict
    createdAt: datetime
    updatedAt: datetime


class FinanceTransactionCreateRequest(BaseModel):
    accountId: str = Field(..., description="Finance account identifier")
    type: Literal['INCOME', 'EXPENSE']
    amount: float
    currency: str = 'BRL'
    description: Optional[str] = None
    category: Optional[str] = None
    date: date
    status: Literal['COMPLETED', 'PENDING', 'CANCELLED'] = 'COMPLETED'
    counterparty: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class FinanceTransactionUpdateRequest(BaseModel):
    description: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    date: Optional[date] = None
    status: Optional[Literal['COMPLETED', 'PENDING', 'CANCELLED']] = None
    counterparty: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class FinancePendingPaymentResponse(BaseModel):
    id: str
    accountId: str
    financeAccountId: str
    createdBy: str
    description: str
    amount: float
    currency: str
    dueDate: date
    recurrence: Literal['ONCE', 'WEEKLY', 'MONTHLY', 'YEARLY']
    priority: Literal['LOW', 'MEDIUM', 'HIGH']
    status: Literal['PENDING', 'OVERDUE', 'PAID']
    category: Optional[str] = None
    counterparty: Optional[str] = None
    notes: Optional[str] = None
    metadata: dict
    createdAt: datetime
    updatedAt: datetime
    paidAt: Optional[datetime] = None


class FinancePendingPaymentCreateRequest(BaseModel):
    accountId: str
    description: str
    amount: float
    currency: str = 'BRL'
    dueDate: date
    recurrence: Literal['ONCE', 'WEEKLY', 'MONTHLY', 'YEARLY'] = 'ONCE'
    priority: Literal['LOW', 'MEDIUM', 'HIGH'] = 'MEDIUM'
    status: Literal['PENDING', 'OVERDUE', 'PAID'] = 'PENDING'
    category: Optional[str] = None
    counterparty: Optional[str] = None
    notes: Optional[str] = None


class FinancePendingPaymentUpdateRequest(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    dueDate: Optional[date] = None
    recurrence: Optional[Literal['ONCE', 'WEEKLY', 'MONTHLY', 'YEARLY']] = None
    priority: Optional[Literal['LOW', 'MEDIUM', 'HIGH']] = None
    status: Optional[Literal['PENDING', 'OVERDUE', 'PAID']] = None
    category: Optional[str] = None
    counterparty: Optional[str] = None
    notes: Optional[str] = None


class FinanceSubscriptionResponse(BaseModel):
    id: str
    accountId: str
    financeAccountId: str
    createdBy: str
    serviceName: str
    amount: float
    currency: str
    billingDay: int
    category: Optional[str] = None
    status: Literal['ACTIVE', 'PAUSED', 'CANCELLED']
    startDate: date
    nextBilling: Optional[date] = None
    notes: Optional[str] = None
    metadata: dict
    createdAt: datetime
    updatedAt: datetime


class FinanceSubscriptionCreateRequest(BaseModel):
    accountId: str
    serviceName: str
    amount: float
    currency: str = 'BRL'
    billingDay: int = Field(ge=1, le=31)
    category: Optional[str] = None
    status: Literal['ACTIVE', 'PAUSED', 'CANCELLED'] = 'ACTIVE'
    startDate: date
    nextBilling: Optional[date] = None
    notes: Optional[str] = None


class FinanceSubscriptionUpdateRequest(BaseModel):
    serviceName: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    billingDay: Optional[int] = Field(default=None, ge=1, le=31)
    category: Optional[str] = None
    status: Optional[Literal['ACTIVE', 'PAUSED', 'CANCELLED']] = None
    startDate: Optional[date] = None
    nextBilling: Optional[date] = None
    notes: Optional[str] = None


class FinanceMarkPendingRequest(BaseModel):
    status: Literal['PENDING', 'OVERDUE', 'PAID'] = 'PAID'
