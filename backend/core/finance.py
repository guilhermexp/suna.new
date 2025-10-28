import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from core.utils.config import config
from core.utils.logger import logger

router = APIRouter(prefix="/finance", tags=["finance"])

DEFAULT_MODEL = os.getenv("GEMINI_FINANCE_MODEL", "gemini-2.0-flash-exp")
SYSTEM_PROMPT = (
    "Você é um parser financeiro que transforma descrições em linguagem natural em JSON estruturado.\n\n"
    "Regras:\n"
    "- Sempre responda apenas com JSON válido, sem texto adicional.\n"
    "- Identifique se a entrada descreve uma TRANSACTION (transação realizada) ou PENDING (pendência a pagar/receber).\n"
    "- Valores devem ser números positivos (use ponto como separador decimal). Interprete moeda a partir do texto (padrão USD se não houver).\n"
    "- Inferir tipo:\n"
    "  * TRANSACTION -> \"type\": \"INCOME\" quando for entrada/recebimento, \"EXPENSE\" quando for saída/pagamento.\n"
    "  * PENDING representa valores futuros ou ainda não liquidados. Use \"recurrence\": \"ONCE\" se não informado.\n"
    "- Datas: utilizar ISO 8601 (YYYY-MM-DD). Se não houver data, deixe vazio (string vazia) e tratamos como hoje.\n"
    "- Prioridade para pendências: HIGH se houver urgência/atraso, MEDIUM se for breve, LOW caso contrário.\n\n"
    "Estrutura esperada:\n"
    "{\n"
    "  \"entryType\": \"transaction\" | \"pending\",\n"
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
    "  \"raw\": string\n"
    "}\n\n"
    "Inclua somente o objeto correspondente ao entryType. O campo \"raw\" deve trazer o texto interpretado após normalização.\n"
)


class InterpretRequest(BaseModel):
    input: str


@router.post("/interpret")
async def interpret_finance(request: InterpretRequest):
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
