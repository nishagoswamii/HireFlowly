# Production Backlog

## P0 — Ship Immediately (Security, Stability, Trust)
- Lock down edge function auth
  - Change `verify_jwt` to `true` in `supabase/config.toml` for `analyze-resume`.
  - Enforce authenticated calls from the client with a valid session.
  - Acceptance: Unauthenticated request receives 401; authenticated user succeeds.
- Tighten CORS and input limits on analyze-resume function
  - Allow only production/staging origins; cap payload sizes for `resumeText` and `jobDescription`.
  - Return 413 for oversized bodies; block unknown origins.
  - Acceptance: Requests from allowed origins under limits pass; blocked origins fail.
- Rate limiting and abuse protection
  - Apply per-user and per-IP rate limits (e.g., 30 req/hr/user; 60 req/hr/IP) at the function edge.
  - Acceptance: Excess requests return 429 with friendly error; normal use unaffected.
- Schema validation and safe model output handling
  - Validate request/response with zod (or similar) server-side in `analyze-resume`.
  - Reject malformed model output; log and surface stable error codes.
  - Acceptance: Invalid payload returns 400; malformed model output handled without 500.
- Observability and error taxonomy
  - Add structured logs (correlation IDs) and consistent error codes for 4xx/5xx/AI gateway failures.
  - Ship dashboards/alerts for error rate, latency, token spend, 402/429 spikes.
  - Acceptance: Logs include request ID; alert triggers on defined thresholds.
- Auth checks and error UX in History
  - Gate history fetch/delete behind auth; show signed-out state guidance.
  - Acceptance: Signed-out users are redirected or see a clear call-to-action; signed-in users load/delete history successfully.
- Tests baseline
  - Add unit tests for PDF parsing, schema validation, and save-analysis behavior; add integration test for analyze flow.
  - Acceptance: `npm test` runs and covers the above with passing assertions.

## P1 — Product Lift (Retention, Explainability)
- Actionable rewrite planner
  - Convert weaknesses into top 3 rewrite cards with suggested text and expected score lift.
  - Acceptance: After analysis, users see rewrite suggestions and can copy them.
- Role- and seniority-aware rubric
  - Parameterize analysis by role (SWE/PM/DS/Design/Sales) and level (Junior/Mid/Senior).
  - Acceptance: Selecting role/level changes rubric and visible recommendations.
- Explainability and provenance
  - For each missing skill, show JD snippet and proposed resume injection point.
  - Acceptance: Users can expand a missing skill and see JD evidence + placement hint.
- Confidence and calibration cues
  - Display confidence bands per score component and a short “how the score was derived.”
  - Acceptance: UI surfaces confidence and method; users can view details without leaving the page.
- Trend and versioning
  - Save versions and show score trends over time; diff analyses in History.
  - Acceptance: History shows timeline chart; selecting two entries shows diff.
- Reliability hardening
  - Bundle PDF worker locally; add timeouts/backoff when calling AI gateway.
  - Acceptance: Offline/slow network still parses PDFs; AI gateway transient errors auto-retry up to limit.

## P2 — Growth and Monetization
- Usage limits and plans
  - Free tier with monthly quota; Pro with higher limits and rewrite/export perks; Team with shared workspace.
  - Acceptance: Enforced quotas; upgrade prompts when exceeded; billing hooks ready.
- Export and sharing
  - PDF/Docx export of rewritten bullets and analysis summary; shareable links with expiration.
  - Acceptance: Export succeeds; shared links respect auth/expiry.
- Notifications and re-engagement
  - Weekly “resume health” email with delta and quick wins; reminders when scores drop.
  - Acceptance: Scheduled email job runs; opt-out respected.
- Extensions and capture
  - Browser extension or quick-add bookmarklet to ingest JDs from job boards.
  - Acceptance: From a job board page, user can send JD into app and run analysis.
- Trust and privacy surface area
  - Data retention controls; clear privacy copy; allow delete/export of user data.
  - Acceptance: Users can delete their data and request export; privacy page published.
