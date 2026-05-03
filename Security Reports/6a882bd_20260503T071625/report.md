# Security Scan Report

No findings.

I reviewed the authenticated browser flows, the Next.js BFF proxy layer, the backend JWT authorization path, and the new Postgres invariant migrations. The diff adds CSRF protection on state-changing browser endpoints and keeps backend write routes behind `require_user`, so I did not find a reportable auth bypass, CSRF bypass, injection, or integrity break that survived validation.

## Coverage Closure

- `web/app/api/auth/login/route.ts`: reviewed; no reportable issue.
- `web/app/api/auth/logout/route.ts`: reviewed; CSRF double-submit enforcement in place.
- `web/app/api/bff/[...path]/route.ts`: reviewed; no reportable issue after backend auth checks were confirmed.
- `web/app/api/bff/sales/route.ts`: reviewed; CSRF and backend auth checks in place.
- `backend/src/services/supabase_auth.py`: reviewed; token verification and profile resolution did not expose a bypass in this diff.
- `backend/src/services/sales_service.py`: reviewed; sales creation continues to bind to active company/customer/session constraints.
- `backend/src/services/cash_service.py`: reviewed via callers and tests; no reportable control break found.
- `supabase/migrations/202605030002_search_indexes_and_db_invariants.sql`: reviewed; the trigger logic strengthens invariants rather than weakening them.

## Artifacts

- [Threat model](./artifacts/threat_model.md)
- [Runtime inventory](./artifacts/runtime_inventory.md)
- [Finding discovery](./artifacts/finding_discovery_report.md)
- [Validation](./artifacts/validation_report.md)
- [Attack-path analysis](./artifacts/attack_path_analysis_report.md)

Final scan bundle: `C:\tmp\codex-security-scans\latas\6a882bd_20260503T071625`
