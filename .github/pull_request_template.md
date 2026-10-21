## Problem and resulting behavior

Explain the concrete trigger, what happened before, and what happens now.

## Verification

List the commands or manual steps actually run, browser/viewports if relevant, and pass/fail results. Do not check off tests that were not run.

Suggested project checks: Run `python3 scripts/source-preflight.py` once that script is available. Before merging auth/storage changes, use a disposable instance and test setup, login, logout, provider connection, and upload/download with non-sensitive fixture files. No automated application test script is declared in package.json.

Relevant user journey: Create the first owner on a disposable instance, sign out/in, connect a test storage destination, upload a small fixture, list it, download it, and compare the downloaded bytes.

## Risks and recovery

Describe persisted-data effects, provider/API changes, and rollback steps if applicable.

## Privacy

Never attach SQLite databases, session cookies, OAuth refresh tokens, provider-secrets.json, storage access keys or real personal files. Use disposable storage accounts and fixture files.
