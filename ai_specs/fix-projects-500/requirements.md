# Requirements: fix-projects-500

## 1. Overview
Goal: Resolve HTTP 500 errors returned by GET /api/projects in local development, ensuring Projects page loads user projects reliably.
User Problem: Dashboard Projects view fails with repeated 500 responses, blocking access to project list and Kanban features.

## 2. Functional Requirements
### 2.1 Core Features
- [ ] FR-1: The backend endpoint GET /api/projects SHALL return 200 with an empty list and valid pagination when the authenticated user has no projects.
- [ ] FR-2: The backend SHALL validate auth and return 401 with clear error only when token/api key is missing/invalid; valid tokens must not trigger 500.
- [ ] FR-3: The backend SHALL be resilient to missing related tables (kanban_tasks) or schema gaps, returning task_count = 0 without raising 500.
- [ ] FR-4: The frontend Projects list fetch SHALL succeed against the local backend using existing auth token, without infinite retries or console floods.

### 2.2 User Stories
As an authenticated user, I want the Projects page to load without server errors so that I can view or create projects.
As a developer, I want the API to degrade gracefully when schema is incomplete so that local dev remains unblocked.

## 3. Technical Requirements
### 3.1 Performance
- Response time: < 300ms on local for empty or small result sets.
- Scalability: Pagination parameters must be applied and not trigger full scans where avoidable.

### 3.2 Constraints
- Technology: FastAPI backend with Supabase client; Next.js frontend using fetch with JWT.
- Dependencies: Supabase schema may not have projects/kanban_tasks tables yet in local; code must handle this.

## 4. Acceptance Criteria
- [ ] WHEN a valid JWT is provided THEN GET /api/projects SHALL return 200 with { projects: [], pagination } when no data exists.
- [ ] IF Supabase returns table-not-found or relation-not-found errors THEN the endpoint SHALL catch and return projects with task_count = 0, status 200 where feasible or a 500 with explicit actionable message only if unavoidable.
- [ ] WHEN the frontend calls /api/projects in local THEN the Projects page SHALL render without error and without flooding the console with repeated 500 logs.
- [ ] Integration: Manual call to GET http://localhost:8000/api/projects with Authorization header returns 200.

## 5. Out of Scope
- Creating or seeding projects or kanban tasks data.
- UI redesign of Projects page.
- Non-local environments behavior (staging/prod).