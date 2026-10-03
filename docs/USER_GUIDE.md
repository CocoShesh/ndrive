# NDrive User Guide

Use this guide to install NDrive, connect storage, organize files, and understand upload routing. For a quick overview and project visuals, see the [main README](../README.md).

<div align="center">
  <img src="assets/data-flow.svg" alt="How browser files, the self-hosted NDrive server, and storage providers connect" width="100%">
</div>

## In this guide

[Install and first launch](#requirements-and-first-launch) · [Docker](#learn-docker-run-ndrive-with-compose) · [Google Drive](#connect-google-drive) · [S3](#connect-s3-compatible-storage) · [Files](#browse-and-organize-cloud-files) · [Uploads](#upload-routing) · [Backups](#backups-and-recovery) · [Troubleshooting](#troubleshooting)

## Requirements and first launch

NDrive requires **Node.js 22.13 or newer**. It uses Node's built-in SQLite support, so a separate MySQL service is not required. NDrive creates `data/ndrive.sqlite` on first launch.

```bash
npm install
npm start
```

Open [http://localhost:4173](http://localhost:4173). On first launch, create the owner account with email/password or continue with Google if Google OAuth is configured. Later visits show the sign-in screen. Google sign-in authenticates your NDrive account; connecting a Google Drive for file storage is a separate permission step.

The server binds to `127.0.0.1` by default. Keep it on localhost or behind a private VPN. **Do not expose it directly to the public internet.** This project does not yet include email verification, password reset, or admin user management.

### Let other users register

Registration is disabled by default so a self-hosted instance cannot be joined by anyone who can reach its login page. To let trusted users create accounts with email/password or Google sign-in, add this to `.env` and restart NDrive:

```env
ALLOW_SIGNUPS=true
```

Each user gets separate server-side connections, API keys, upload policy, and browser-local workspace. S3 credentials are configured once for the NDrive instance and shared by its users. For a public multi-user service, put NDrive behind HTTPS and a trusted private-access layer.

When Google OAuth is configured, **Continue with Google** signs in an existing NDrive user whose verified email matches. The first Google user can create the initial owner account; additional Google accounts can register only when `ALLOW_SIGNUPS=true`.

### Learn Docker: run NDrive with Compose

Docker lets you run NDrive in a packaged environment without installing Node.js or SQLite directly on your computer. This project includes a `Dockerfile` (the build recipe) and `docker-compose.yml` (the run settings).

#### 1. Check Docker

Install Docker Desktop on Windows or macOS, or Docker Engine with the Compose plugin on Linux. For Ubuntu 24.04 or a compatible Ubuntu-based system, the distro packages are a straightforward way to start learning:

```bash
sudo apt update
sudo apt install docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo docker run hello-world
```

For another Linux distribution, follow [Docker's official installation guide](https://docs.docker.com/engine/install/). Then check that both commands are available:

```bash
docker --version
docker compose version
```

On Linux, prefix Docker commands with `sudo` unless you have deliberately configured another access method. Docker's `docker` group grants root-level privileges, so using `sudo` is a good way to begin without changing account permissions.

#### 2. Open the NDrive project folder

Use a terminal in the folder that contains `Dockerfile` and `docker-compose.yml`. If you later clone your own NDrive Git repository, open the cloned folder instead. The GitHub reference project is not this NDrive implementation.

#### 3. Add server settings

Create a private settings file from the example, then edit it:

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Add your Google OAuth values and a newly generated `CREDENTIAL_ENCRYPTION_KEY` if you plan to connect Google Drive. Keep `.env` private; it contains secrets. Leave `ALLOW_SIGNUPS` unset (or `false`) until you intentionally want other people who can reach this server to create accounts.

#### 4. Build the image and start NDrive

```bash
sudo docker compose up -d --build
```

`build` reads the Dockerfile, downloads the Node image, installs the app's production packages, and packages the NDrive source. `up` creates and starts the container. `-d` leaves it running in the background. `--build` rebuilds the image when the source changes.

Open [http://localhost:4173](http://localhost:4173). Create your owner account the first time.

#### 5. See whether it is running

```bash
sudo docker compose ps
sudo docker compose logs -f ndrive
```

`ps` shows container status. `logs -f` follows the server log; press **Ctrl+C** to stop following the log (the NDrive container keeps running).

#### 6. Stop, restart, and update

```bash
sudo docker compose stop
sudo docker compose start
sudo docker compose down
sudo docker compose up -d --build
```

`stop` pauses the container; `start` resumes it. `down` removes the stopped container and network. It does not delete this project's `data/` folder. To apply code or Dockerfile changes, run the final `up -d --build` command.

#### 7. Understand where your data lives

Compose maps the project `./data` folder into the container at `/app/data`. This is a **bind mount**: the SQLite database and encrypted provider tokens survive container rebuilds because they live in your project folder, not inside the replaceable container. Back up both `data/` and `.env` somewhere private. Keep the encryption key; without it, saved Google refresh tokens cannot be decrypted.

For a private backup while NDrive is stopped:

```bash
docker compose stop
umask 077
sudo tar -czf - data .env > ndrive-backup.tar.gz
docker compose start
```

The archive contains credentials and user data. Store it securely and never upload it to a public repository or share it in chat.

A good learning exercise is to rebuild the image after changing a heading in `app.js`, then use `docker compose logs -f ndrive` to watch the server restart. The image is replaceable; `data/` is the important persistent folder.

#### 8. What this setup does not do

This Compose file publishes NDrive on your computer's loopback address only (`127.0.0.1:4173`), so other computers cannot access it directly. Do not change that to a public port for an internet-facing deployment. Remote access needs HTTPS through a trusted reverse proxy or private VPN, production OAuth configuration, and additional account-recovery, admin, and abuse controls. Google's current rules also distinguish Testing from Production and may require OAuth verification for Drive scopes; see [Google's app publishing guidance](https://support.google.com/cloud/answer/15549945) and [Drive scope guidance](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).

For early use by other people, the safer path is to give each person or trusted team its own NDrive instance. A single public multi-user service is a later product decision and needs more security and support work first.

## Connect Google Drive

1. In Google Cloud Console, select a project, enable **Google Drive API**, and create an OAuth client with type **Web application**.
2. In **Google Auth Platform → Branding**, set the app name and support email. Under **Audience**, use **External** for a personal Google account. If the app is in **Testing**, add every account that will connect under **Test users**.
3. Add this Authorized redirect URI exactly:

   ```text
   http://localhost:4173/api/providers/google/callback
   ```

4. Generate a 32-byte encryption key:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

5. Copy `.env.example` to `.env` and set:

   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:4173/api/providers/google/callback
   CREDENTIAL_ENCRYPTION_KEY=paste-the-64-character-hex-key
   ```

6. Restart NDrive. In NDrive, click **+** beside **Your storage** (or **Provider settings**), then connect Google Drive. To add more, choose **Add another Google account** in that same panel; Google will show an account chooser so you can select a different account. Each connected account gets its own file list and quota card, and Storage shows a combined quota summary with a per-account breakdown. Use **Refresh totals** to fetch current quota values.

Google sign-in only authenticates your NDrive user; it does not automatically connect that user's Drive. Each Google Drive identity can be connected to one NDrive user at a time. To move a Drive to another NDrive user, sign in to the old NDrive account, choose **Storage**, and disconnect that Drive first. Then sign in to the new NDrive account and connect it there. Disconnecting removes NDrive's connection; it does not delete files from Google Drive. There is no fixed NDrive account-count cap, though Google API limits still apply.

The same OAuth client and redirect URI also enable **Continue with Google** on the NDrive sign-in screen. NDrive requests OpenID Connect identity scopes (`openid`, `email`, `profile`) for login, then requests Drive scopes only when you separately connect Drive storage. The Google account must be listed as a test user while the OAuth app is in Testing mode.

NDrive asks for `drive.file`, `drive.metadata.readonly`, and the signed-in email. The metadata scope is used to show Google account storage and estimate space available for Drive uploads. Where Google returns it, each account card also separates Drive files and trash from the estimated use by other Google services. Google storage is shared across Drive and other Google services. If an older connection has no quota information, use **Reconnect** in Storage to grant the new scope. The refresh token is encrypted with AES-256-GCM in SQLite. Keep the encryption key safe: if it is lost or changed, saved refresh tokens cannot be decrypted. An app in Testing mode may require you to reconnect when Google expires its test authorization.

For a personal or development instance, you can keep the app in Testing and allow-list your own account. Public use may require Google OAuth verification for the requested scopes.

## Connect S3-compatible storage

Configure the S3 credentials in the server's `.env` file. For Cloudflare R2:

```env
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=your-bucket
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
# Optional for temporary AWS credentials:
# S3_SESSION_TOKEN=...
# Optional bucket capacity estimate for routing, in bytes:
# S3_CAPACITY_BYTES=1099511627776
```

For AWS S3, leave `S3_ENDPOINT` unset and use the bucket's AWS region. Create a bucket-scoped key with list, get, put, delete, and multipart-upload permissions. NDrive stores objects under the `ndrive/` prefix. Restart NDrive and choose **Storage → Test** to verify the bucket.

S3-compatible services do not provide a universal quota API. Set `S3_CAPACITY_BYTES` if you want **Most available** routing to compare a bucket against Google quota. Without it, NDrive treats the S3 bucket as an unbounded destination. The key and secret stay on the server.

## Browse and organize cloud files

- **Cloud files** lists root-level items across connected destinations. Use **Manage** to open an account.
- Inside a provider, open folders to browse them. Use **New folder**, **Rename**, **Move**, **Delete**, and **Sync** to organize provider files.
- **Sync** refreshes NDrive's searchable metadata index from that provider. Cloud files themselves remain in Google Drive or S3.
- Google Drive files live in an NDrive folder. S3 objects and folders live under the bucket's `ndrive/` prefix.
- **This device** stores bytes in the current browser profile's IndexedDB. Clearing browser site data can remove those files.

## Upload routing

From **This device** or **Cloud files**, choose **Upload files** and select one of:

- **This device** to keep the upload in the browser.
- **Automatic cloud routing** to apply your account's saved policy.
- A specific account to upload directly to it.

In **Storage**, the combined Google total sums the limit, used space, and free space reported for every connected Google account. The accounts remain separate: uploads are stored in one account at a time, and one file cannot use free space from multiple accounts. Google reports account storage shared across Drive and other Google services, so quota can be consumed by Gmail or Photos too. If one account's quota cannot be read, the combined figures are labeled partial and the unavailable account is not counted.

In **Storage**, choose a policy:

- **Most available** picks the destination with the most reported free capacity. Before an automatic cloud or API upload, NDrive refreshes each Google quota; accounts whose quota cannot be read are skipped. A direct upload to a selected account remains available.
- **Priority order** uses the order shown in Storage; use the arrows to rearrange destinations.
- **Round robin** rotates through destinations that can accept the file.

The upload panel reports transfer progress. NDrive does not keep a server-side retry copy if a cloud upload is interrupted.

## Upload API

Open **Storage → Upload API docs & keys**. Create a named key and copy it immediately; NDrive stores only its hash and never shows it again. Revoke a key from the same screen if it is lost.

The upload API accepts a raw request body and uses the signed-in user's default routing policy:

```bash
curl -X POST http://localhost:4173/api/v1/uploads \
  -H 'Authorization: Bearer ndrive_live_YOUR_KEY' \
  -H 'X-File-Name: report.pdf' \
  -H 'Content-Type: application/pdf' \
  --data-binary @report.pdf
```

`X-File-Name` should be URL-encoded when it contains non-ASCII characters. Keys can upload files; they cannot list, download, move, or delete files.

## Backups and recovery

- Back up the entire `data/` directory and the `.env` file securely. `data/` contains users, sessions, account records, file indexes, and encrypted Google tokens.
- Back up `CREDENTIAL_ENCRYPTION_KEY` separately. The database copy of a Drive refresh token is unusable without it.
- Browser-local file bytes are not in `data/`; export or separately back up important local files.
- Do not commit `.env`, `data/`, or API keys. Do not add a public reverse proxy until HTTPS, user access policy, backups, and account recovery are configured.

## Configuration reference

`.env.example` documents the available values. Useful options include:

| Variable | Purpose |
|---|---|
| `HOST`, `PORT` | Bind address and port; defaults to `127.0.0.1:4173` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Google OAuth web client |
| `CREDENTIAL_ENCRYPTION_KEY` | 64 hex characters for Google token encryption |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | S3-compatible bucket |
| `S3_SESSION_TOKEN` | Optional temporary AWS credential token |
| `S3_CAPACITY_BYTES` | Optional quota estimate for routing |
| `ALLOW_SIGNUPS` | Set to `true` to show account registration after initial setup |
| `MAX_UPLOAD_BYTES` | Maximum API upload size; defaults to 5 GiB |
| `NDRIVE_DB_FILE` | Optional SQLite database path |
| `NDRIVE_SECRETS_FILE` | Legacy credential file path used during migration |

## Current limits

- The embedded database is SQLite rather than MySQL/Prisma; it is appropriate for a single NDrive server and simplifies local installation.
- No email verification, password reset, SSO for NDrive accounts, or user administration screen yet.
- No hosted/public file shares, cross-provider copy, or automatic failover after a mid-stream upload error.
- Drive folders and file operations are provider-backed. The Cloud files index currently aggregates each provider's top-level folder; use **Manage** to browse nested folders.
- Only one S3 bucket configuration is shared by the NDrive instance; multiple Google Drive accounts are supported per user.

## Troubleshooting

- **NDrive asks you to sign in on first launch:** Create the owner account. Existing browser-local workspace data stays under the owner profile.
- **Google access is blocked during testing:** Add the Google account under **Google Auth Platform → Audience → Test users**.
- **Drive API has not been used or is disabled:** Enable **Google Drive API** in the same Cloud project as the OAuth client, then wait a few minutes and retry.
- **Quota is unavailable:** Use **Reconnect** for that account so NDrive can request the read-only Drive metadata scope.
- **OAuth state did not match:** Keep the server running during authorization and use the same hostname (`localhost`) before and after Google's redirect.
- **S3 test fails:** Check bucket, endpoint, region, key scope, and whether the server can reach that endpoint.
- **Upload routing says no destination is available:** Connect another provider, refresh the Storage page, or increase the configured S3 capacity estimate.
