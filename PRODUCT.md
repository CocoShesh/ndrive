# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The current instance is used by its owner. The owner plans to deploy NDrive for other users later. The deployment and onboarding model for those users is undecided.

## Product Purpose

NDrive is a self-hosted workspace for managing browser-local files, multiple Google Drive accounts, and an optional S3-compatible bucket from one interface. Success means users can find, organize, and upload files to the intended storage account while understanding where each file is stored and how much space is available.

## Positioning

NDrive keeps storage-provider credentials on the self-hosted server and streams cloud file operations to the selected provider. Google Drive connections belong to an individual NDrive user; the same Drive identity can belong to only one NDrive user at a time.

## Operating Context

The owner configures OAuth and optional S3 credentials on the server. Users sign in to NDrive, then separately authorize each Google Drive account they want to use for storage. The first NDrive user is the owner. Registration is currently enabled on this local instance; public deployment is planned but not yet confirmed as an open-signup service. The owner is learning Docker and wants step-by-step deployment instructions that explain the commands.

## Capabilities and Constraints

- Users can browse local files and connected cloud storage, create folders, upload, download, rename, move, delete, sync, and route uploads.
- A user can connect multiple Google Drive accounts. Their reported storage quotas are shown per account and as a combined total. One file is stored in one account at a time and must fit that account's available quota.
- Google sign-in authenticates the NDrive user; it does not grant Drive file access. A separate Drive authorization is required.
- If a Drive account is linked to another NDrive user, the user must disconnect it from the original NDrive account before linking it elsewhere.
- No per-user Drive-account cap has been selected. Google API quotas and each account's storage limit still apply.
- Email verification, password reset, and admin user management are not implemented yet.
- The future deployment model (each user/team runs an instance, or one managed multi-user service) remains undecided.

## Brand Commitments

The product is named NDrive. It is privacy-first and self-hosted.

## Evidence on Hand

The current application, provider integrations, and usage instructions are in this project. No external security review, Google OAuth verification, or public deployment approval has been completed.

## Product Principles

- Make the destination and ownership of every cloud file clear.
- Do not imply that combined free space can store one file across accounts.
- Keep Google identity sign-in separate from Drive storage authorization.
- Keep provider credentials server-side and scoped to the signed-in NDrive user.
- Explain errors with a clear recovery step.
