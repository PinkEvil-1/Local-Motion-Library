# Independent acceptance verification

Run: `node tests/acceptance.mjs` with the production preview server at http://127.0.0.1:4173.

Browser: Microsoft Edge via Playwright. Tested at 2026-11-03T03:55:35.407Z.

- PASS: Catalog initial count, pagination and visible source attribution
- PASS: English name search and independent prompt/style indexing
- PASS: Cross filters match independent catalog calculation
- PASS: Favorites persist on reload
- PASS: Native modal, source link, prompt, replay and Escape
- PASS: Custom preview text reaches runtime
- PASS: Prompt copy includes original prompt and source
- PASS: JSON export contains complete dataset
- PASS: Page switching and latest ordering
- PASS: Mobile layout fits viewport and dialog remains operable
- PASS: No automatic external HTTP requests
- PASS: No browser page errors during acceptance scenarios

External HTTP requests were blocked and recorded during all scenarios. Screenshot: preview.png. Machine-readable results: acceptance-results.json.

This verifies application workflows, not pixel-for-pixel fidelity or all 331 animations. The coordinator runs the separate exhaustive renderer smoke check.
