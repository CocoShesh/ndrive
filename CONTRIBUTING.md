# Contributing to ndrive

## Start with the correct application

Use Node.js 22.13+ (Node.js 24 is also suitable). Run `npm ci`, copy `.env.example` to `.env`, generate `CREDENTIAL_ENCRYPTION_KEY` as 64 hexadecimal characters, then run `npm start`. The default URL is http://localhost:4173. The first registered account becomes the owner. Docker Compose mounts `./data` into `/app/data`.

## Keep changes reviewable

Describe the observed problem and the behavior after your change. Keep one concern per pull request; avoid unrelated dependency updates and formatting churn. Read existing repository instructions before changing source.

## Verification

Run `python3 scripts/source-preflight.py` once that script is available. Before merging auth/storage changes, use a disposable instance and test setup, login, logout, provider connection, and upload/download with non-sensitive fixture files. No automated application test script is declared in package.json.

For browser changes, check 390 × 844, 768 × 1024 and 1440 × 900 viewports. Look for horizontal overflow, clipped controls, readable text and keyboard focus. Record the actual browser and dimensions; a screenshot alone does not prove the whole journey.

Useful end-to-end check: Create the first owner on a disposable instance, sign out/in, connect a test storage destination, upload a small fixture, list it, download it, and compare the downloaded bytes.

## Handle sensitive data

Never attach SQLite databases, session cookies, OAuth refresh tokens, provider-secrets.json, storage access keys or real personal files. Use disposable storage accounts and fixture files.

## Before opening a pull request

- Explain what changed and why.
- List commands actually run and their results; state skipped checks explicitly.
- Include reproducible steps for bug fixes and relevant screenshots for UI changes.
- Describe migration or rollback needs when changing persisted data.
