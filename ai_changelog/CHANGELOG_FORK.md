# Suna Fork - Changelog

All notable changes to the Suna self-hosted fork are documented here.

## Version History

### [Unreleased]

#### Documentation
- 📚 **Implemented comprehensive AI documentation structure** (2025-11-03)
  - Created ai_changelog/, ai_docs/, ai_issues/, ai_research/ directories
  - Organized 53 existing documentation files
  - Created README files for each documentation directory
  - Established documentation standards and organization system
  - Related: Phase 4 Master Files Update

### [1.0.0] - Self-Hosted Fork Release

#### Features
- ✅ Railway deployment configuration
- ✅ 302.AI custom model integration with 70% cost savings
- ✅ LOCAL mode billing system (no Stripe required)
- ✅ Comprehensive agent execution system with Supabase
- ✅ Tool registry with 34+ built-in tools
- ✅ Browser automation, file management, web search capabilities

#### Critical Customizations
- **302.AI Custom Model**: Claude endpoint with optimized pricing
- **LOCAL Billing Mode**: Self-hosted billing without cloud dependencies
- **Railway Auth Handling**: Custom SSR-safe authentication
- **Supabase Integration**: Full persistence and real-time capabilities

#### Known Issues (Fixed)
- Railway API prefix issues (see ai_issues/RAILWAY_*_FIX.md)
- Authentication token expiry on Railway platform
- Worker background job configuration
- Deployment infrastructure issues

#### Documentation
- Created CLAUDE.md with comprehensive project context
- Documented upstream sync procedures
- Detailed critical customizations that must be preserved
- Created development command reference

---

## Upcoming Features (Planned)

### Next Phase
- [ ] Calendar page implementation with real database
- [ ] Finance control page enhancements
- [ ] Projects kanban board UI
- [ ] KB document preview improvements
- [ ] Enhanced project 500 error handling

---

## Sync History

### Last Upstream Sync
- **Date**: 2025-10-04
- **Upstream**: https://github.com/kortix-ai/suna.git
- **Status**: ✅ Complete
- **Customizations Preserved**: Yes
- **Testing Status**: Billing, auth, and 302.AI model verified

### Sync Procedure
See: `docs/workflows/UPSTREAM_SYNC_WORKFLOW.md`

---

## Breaking Changes

None currently documented in this version.

---

## Documentation Updates

See individual specification files in `ai_specs/` for feature-specific changes.
