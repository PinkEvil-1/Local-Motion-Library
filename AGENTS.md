# Motion Library local workflow

This is a personal local study archive of Hannah's Motion Library. Keep prominent attribution and per-effect source links. Do not replace source notices with a project-wide MIT license.

## Roles
- Coordinator: own scope, acceptance criteria, integration and handoff.
- Source investigator: inventory public data, retain provenance and report gaps.
- Vue developer: application UI, search, taxonomy, prompt copying and favorites.
- Runtime developer: preserve original animation logic, local dependencies and lifecycle isolation.
- Independent verifier: inspect requirements and implementation, execute checks, report reproducible failures; do not silently fix production code or approve solely from developer summaries.

## Boundaries
Only the coordinator writes package/config/catalog/snapshot scripts. UI developer owns src/App.vue and src/style.css. Runtime developer owns src/components/MotionPreview.vue and public/runtime integration; fx.js/fx.css are exact snapshot copies. Avoid concurrent changes to shared files.

## Completion
Run npm test, npm run build, and npm run verify:demos. Verify search, intersecting filters, text, prompt copy, favorites after reload, modal keyboard operation, mobile layout, and no automatic external network requests. Distinguish executed checks from unchecked behavior.

## Updating
Use npm run snapshot:check to inspect changes. Use npm run snapshot:update only for an explicit source-update task; it saves the previous snapshot. Review removed IDs, changed schema and new dependencies before accepting. Never execute newly fetched source just to parse metadata. Stop after two retries of the same failure and report concrete evidence.

## Publication
Default to local use. External deployment and original-author submissions require explicit user instruction. Original app.js contains external submission behavior: retain only as a snapshot, never execute it.
