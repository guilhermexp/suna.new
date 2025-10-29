"""API Models for AgentPress

This module contains all Pydantic models used for API request/response validation.
Models are organized by domain for better maintainability.
"""

from .common import (
    PaginationInfo,
)

from .agents import (
    AgentCreateRequest,
    AgentUpdateRequest,
    AgentResponse,
    AgentVersionResponse,
    AgentVersionCreateRequest,
    AgentsResponse,
    ThreadAgentResponse,
    AgentExportData,
    AgentImportRequest,
    AgentIconGenerationRequest,
    AgentIconGenerationResponse,
)

from .threads import (
    AgentStartRequest,
    InitiateAgentResponse,
    CreateThreadResponse,
    MessageCreateRequest,
)

from .imports import (
    JsonAnalysisRequest,
    JsonAnalysisResponse,
    JsonImportRequestModel,
    JsonImportResponse,
)

from .projects import (
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectResponse,
    ProjectsResponse,
    KanbanTaskCreateRequest,
    KanbanTaskUpdateRequest,
    KanbanTaskResponse,
    KanbanTasksResponse,
    ProjectIconGenerationRequest,
    ProjectIconGenerationResponse,
    TaskBulkUpdateRequest,
    TaskBulkUpdateResponse,
)

from .calendar import (
    CalendarEventCreateRequest,
    CalendarEventUpdateRequest,
    CalendarEventResponse,
    CalendarEventsResponse,
)

from .finance import (
    FinanceAccountResponse,
    FinanceSummaryVariation,
    FinanceSummaryCrypto,
    FinanceSummaryResponse,
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


__all__ = [
    # Agent models
    "AgentCreateRequest",
    "AgentUpdateRequest", 
    "AgentResponse",
    "AgentVersionResponse",
    "AgentVersionCreateRequest",
    "AgentsResponse",
    "ThreadAgentResponse",
    "AgentExportData",
    "AgentImportRequest",
    "AgentIconGenerationRequest",
    "AgentIconGenerationResponse",
    
    # Thread models
    "AgentStartRequest",
    "InitiateAgentResponse",
    "CreateThreadResponse",
    "MessageCreateRequest",
    
    # Import models
    "JsonAnalysisRequest",
    "JsonAnalysisResponse", 
    "JsonImportRequestModel",
    "JsonImportResponse",
    
    # Common models
    "PaginationInfo",

    # Project models
    "ProjectCreateRequest",
    "ProjectUpdateRequest",
    "ProjectResponse",
    "ProjectsResponse",
    "KanbanTaskCreateRequest",
    "KanbanTaskUpdateRequest",
    "KanbanTaskResponse",
    "KanbanTasksResponse",
    "ProjectIconGenerationRequest",
    "ProjectIconGenerationResponse",
    "TaskBulkUpdateRequest",
    "TaskBulkUpdateResponse",
    
    # Calendar models
    "CalendarEventCreateRequest",
    "CalendarEventUpdateRequest",
    "CalendarEventResponse",
    "CalendarEventsResponse",

    # Finance models
    "FinanceAccountResponse",
    "FinanceSummaryVariation",
    "FinanceSummaryCrypto",
    "FinanceSummaryResponse",
    "FinanceTransactionResponse",
    "FinanceTransactionCreateRequest",
    "FinanceTransactionUpdateRequest",
    "FinancePendingPaymentResponse",
    "FinancePendingPaymentCreateRequest",
    "FinancePendingPaymentUpdateRequest",
    "FinanceSubscriptionResponse",
    "FinanceSubscriptionCreateRequest",
    "FinanceSubscriptionUpdateRequest",
    "FinanceMarkPendingRequest",
]
