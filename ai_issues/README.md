# AI Issues Directory

## Purpose
Centralized tracking of bugs, known issues, blockers, and technical problems. Maintains both active issues and resolved issues archive for reference.

## Organization
- **Active Issues**: Current bugs, blockers, and problems being addressed
- **Resolved Issues**: Archived issues that have been fixed (for historical reference)
- **Issue Format**: One major issue per file with detailed context and resolution status

## Current Issues
### Active Issues
(None currently)

### Resolved Issues
- `DEPLOYMENT_FIXES_REPORT.md` - Deployment infrastructure issues and resolutions
- `RAILWAY_AUTH_FIX_REPORT.md` - Railway platform authentication issues and fixes
- `RAILWAY_LOGIN_FIX.md` - Login system fixes for Railway deployment
- `RAILWAY_WORKER_FIX.md` - Background worker configuration issues and solutions

## Issue Format
Each issue file should include:
- **Title**: Clear, descriptive issue name
- **Status**: Active / Resolved / In Progress
- **Severity**: Critical / High / Medium / Low
- **Description**: Detailed explanation of the problem
- **Root Cause**: Analysis of underlying issue
- **Solution**: How the issue was resolved (if resolved)
- **Resolution Date**: When the issue was fixed
- **Related Issues**: Links to dependent or related issues
- **Testing**: How to verify the fix

## Guidelines for Adding New Issues
1. Create descriptive filename (e.g., `auth-token-expiry-bug.md`)
2. Include clear title and status indicator
3. Document root cause analysis
4. Reference related specifications or code files
5. Move to resolved archive when fixed
6. Update this README

## Archival Process
- When an issue is resolved, move it to an "RESOLVED" subfolder or append "[RESOLVED]" to filename
- Keep resolved issues for historical reference (search and learning)
- Include resolution date and approach in moved files

## Last Updated
2025-11-03

---
Regular review of this directory helps identify patterns and prevent recurring issues.
