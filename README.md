# testnet-demo

Testnet Vercel/Supabase migration

## Quick Start

This guide helps you set up the Verafy Testnet Demo locally or deploy it to Vercel with Supabase. It assumes you’re starting fresh after cloning the repository. The app is a Next.js frontend with a broadcaster and validator services, using Supabase (PostgreSQL) for storage and for real-time communication.

This migration is from @jbrace02's original repo here: https://github.com/VerafyTechnologies/VerafyTestnet-J1

### Prerequisites

- **Node.js**: v18+ (v22.14.0 recommended, as used in development).
- **npm**: v9+ (bundled with Node.js).
- **Git**: For cloning the repo.
- **Supabase CLI**: For local Supabase setup (optional for Vercel).
- **Vercel CLI**: For deployment (optional).
- **OpenSSL**: For generating encryption keys (optional, pre-installed on most systems).

### Local Setup

#### 1. **Clone the Repository**:

```bash
git clone https://github.com/VerafyTechnologies/testnet-demo.git
```

#### 2. **Switch to Project Folder**

```bash
cd testnet-demo
```

#### 3. **Install Node Dependencies**

```bash
npm install
```

#### 4. **Install Legacy Node Dependencies**

May not need, but run in case of issues.

```bash
npm install --legacy-peer-deps
npm install axios openai --legacy-peer-deps
```

**Note**: A few libraries require `--legacy-peer-deps` due to a conflict between `react@19.1.0` and `vaul@0.9.9`

⚠️ If you hit any other conflicts adding future libraries this should fix it:
`npm install <library with conflict> --legacy-peer-deps`

#### 5. **Set Up Environment Variables**:

- Copy the example `.env` file:
  ```bash
  cp .envExample .env
  ```
- Edit `.env` with your keys (see "ENV File" section below). For local testing:
  - Generate encryption keys:
    ```bash
    openssl rand -hex 16  # Outputs ENCRYPTION_KEY (32 chars)
    openssl rand -hex 8   # Outputs ENCRYPTION_IV (16 chars)
    ```
  - Use your Supabase `DATABASE_URL` and AI provider API keys.

#### 6. **Install Supabase CLI (Optional for Local DB)**:

- If not already installed:
  ```bash
  npm install -g supabase
  ```

* Other useful Supabase CLI commands:
  ```
  supabase -v
  supabase start
  supabase status
  supabase stop
  ```

#### 7. **Start Local Supabase**:

- For local database testing:
  ```bash
  supabase start
  ```
- Copy the local `DATABASE_URL` from the output (e.g., `postgresql://postgres:postgres@localhost:54322/postgres`) into `.env` if not using the remote DB.

Recommended to have in your .env (also a sample .env is in .envExample and below)

```bash
# set your current db url (dev, Default): export DATABASE_URL=$LOCAL_DATABASE_URL
# set your current db url (prod): export DATABASE_URL=$REMOTE_DATABASE_URL
# verify your current db url (if blank uses default local): echo $DATABASE_URL

LOCAL_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
REMOTE_DATABASE_URL=postgresql://postgres:[your-db-password]@db.[project id].supabase.co:6543/postgres?pgbouncer=true
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres" # Default to local, if not set manually


```

#### 8. **Connect to Remote Supabase (Recommended)**:

- Set the remote DB (replace with your team’s Supabase URL Project ref.):
  ```bash
  supabase link --project-ref quuuhdbozcmhkwzhamuh
  ```
  ⚠️ You have to be logged in with: `supabase login` if you have not.
  note: You will see the project ref in the dashboard if you go to https://supabase.com/dashboard and then click on the testnet-demo project in there it will be in the url like: `https://supabase.com/dashboard/project/quuuhdbozcmhkwzhamuh`
- Pull the schema from remote to local (if you want to refresh your local DB with the remote one ):
  ```bash
  supabase db pull
  ```
- Update `.env` with the database url you are using with export `DATABASE_URL` (see "ENV File" below).
- Creates or updates supabase/migrations/ with files like 20230404123456_remote_schema.sql.

Check local to make sure tables are there: http://127.0.0.1:54323/project/default/database/tables

If not there run:

```
supabase migration up
```

Check local dashboard Studio URL: http://127.0.0.1:54323/project/default/database/tables

If you want to use the local database instead of the rmote, change the .env file to:

`DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres`

#### 9. **Run Prisma Setup**:

- Sync the schema with Supabase:

  ```bash
  npx prisma db push --schema prisma/schema.prisma
  ```

  note: If you do a remote prisma push (to change the Supabase remote database), you need to use the "direct db url":
  example of how it looks: postgresql://postgres.quuuhdbozcmhkwzhamuh:<your password>@aws-0-us-east-1.pooler.supabase.com:5432/postgres

#### 10. **Start the Application**:

```bash
npm run dev
```

- Access at http://localhost:3000
- View the Local Studio url: http://127.0.0.1:54323
- This gives Database views, SQL editor, logs and more.

#### 11. **Run QA Tests**

- In a separate terminal:
  ```bash
  npm run qa
  ```
  - Requires `npm run dev` running. Tests endpoints like `/api/broadcast` and `/api/admin/health-check`.

---

## Prisma notes

There are some weird things I've run into with Prisma, be aware of them so you do not waste time trying to debug.

### A typical pattern: you need a new field or table.

#### Add/remove table/fields Workflow:

1. Update the prisma/prisma.schema.
2. `npx prisma db push` for remote database sync.
3. With Supabase+Prisma you have to use the "direct" DB connection, not the pgBouncer we use in the normal (used for performance)
4. So temporarily use the format of PRISMA_DATABASE_URL (see in the .envExample if you do not have it in .env) as the DATABASE_URL (copy it in place of that, put int he password too). We use this url only for the push and then revert back to the original.
5. `npx prisma db push`
6. Confirm that worked on the remote database (go to supabase dashboard or use psql).
7. Switch back to the original DATABASE_URL.
8. We need to generate types with: `npx prisma generate`
9. If they do not update go into `node_modules/.prisma` and remove or rename `index.d.ts` and `index.js`
10. Do `npx prisma generate` again, it should fix it.

## Prisma Migrations

These can be a serious pain. One thing I learned is if you look up docs using AI or Google, you may find some things that are not correct.

* **Using AI for code: You absolutely MUST specify that you are using Supabase/Prisma.** This stack has a different way of doing migrations than normal Prisma+Postgres. If you do not specify this, you will get incorrect instructions.

Also, always do a backup first.

**As a result if you follow the other non-Supabase docs you will get errors.**

I am not sure if this will always be the case, but I have run into this several times.

### Migration Steps (Manual example)

**IMPORTANT:**
* Always backup your database before running migrations. Its even a good idea to backup againn after a successful one, in case another engineer messes something up later and you need to restore what you just did successfully.
* If you use AI to generate code for a schema, make sure it has not removed any fields you need, or added any that are not needed-- including indexes. I've noticed times where it removed needed lines and indexes.

The method below is a manual migration process that works with Supabase+Prisma. It is not the only way, but it is the one I have found to work best. Migrations can be tricky, so always backup first and test thoroughly.

### 0. Backup the Database (REQUIRED)

You have to use postgres 15 or later, so make sure you have that installed.

```bash
pg_dump --version
```

MacOS:
```bash
brew install postgresql@15
brew --prefix postgresql@15
```

`export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"`

```bash
PGPASSWORD="your_password" pg_dump \
  -h aws-0-us-east-1.pooler.supabase.com \
  -U postgres.quuuhdbozcmhkwzhamuh \
  -p 5432 \
  -d postgres \
  -F c \
  -f 20250530-remote_supabase_backup.dump

```

### 1. Temporarily replace the DATABASE_URL in .env (just for Prisma migration)

Replace DATABASE_URL with the PRISMA_DATABASE_URL (see below)

```bash
DATABASE_URL=postgresql://postgres.quuuhdbozcmhkwzhamuh:<password>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&noPrepare=true&connection_limit=1

PRISMA_DATABASE_URL=postgresql://postgres.quuuhdbozcmhkwzhamuh:<password>@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### 2. Verify schema.prisma is correct (run through AI is a good idea)

⚠️ WARNING: Dropping a column will permanently delete any existing password data in the table.

⚠️ Always backup first! Avoid major headaches!!!

### 3. Generate Migration SQL

```
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > migration.sql
```

#### 4. Manually apply

```
psql "postgresql://postgres.quuuhdbozcmhkwzhamuh:<PASSWORD>@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require" < migration.sql
```

#### 5. Mark the Migration as Applied

psql "postgresql://postgres.quuuhdbozcmhkwzhamuh:<PASSWORD>@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"


```sql
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (gen_random_uuid(), 'checksum-placeholder', NOW(), '20250530_add_favorites', '', NULL, NOW(), 1);

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (gen_random_uuid(), 'checksum-placeholder', NOW(), '20250530_add_favorites_alter_update', '', NULL, NOW(), 1);

```

#### 6. Move SQL to Migration Folder

```
mkdir -p prisma/migrations/20250501_add_user_auth
mv migration.sql prisma/migrations/20250501_add_user_auth/migration.sql
```

#### 7. Remove in node_modules the prisma types

Sometimes the types do not update correctly, so you need to remove the old ones.

```
rm -rf node_modules/.prisma/client/index.d.ts node_modules/.prisma/client/index.js
```

#### 8. Update app logic with to sync with the DB types, npx prisma generate

```bash
npx prisma generate
```
---

## Deployment

- **Tip:** Run `npm run build` to detect issues before deploy. Many problems deploying are due to errors/warning during build.

- **Tip":** Run `npx tsc --noEmit` to get build errors. These need to be fixed before deploying.

#### 1. Install Vercel CLI (If Not Done):

```bash
npm install -g vercel
```

#### 2. Verify install and version

```bash
vercel --version
```

#### 3. Vercel login

```bash
vercel login
```

#### 4. Vercel deploy a local build (for faster deploy)

```bash
vercel --prebuilt
```

- Follow prompts to log in with your Vercel account (or team account if applicable).

#### 4. Set Up Environment Variables Locally:

```bash
# set your current db url (dev, Default): export DATABASE_URL=$LOCAL_DATABASE_URL
# set your current db url (prod): export DATABASE_URL=$REMOTE_DATABASE_URL
# verify your current db url (if blank uses default local): echo $DATABASE_URL

LOCAL_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
REMOTE_DATABASE_URL=postgresql://postgres:[your-db-password]@db.[project id].supabase.co:6543/postgres?pgbouncer=true
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres" # Default to local, if not set manually

REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=your-32-char-key  # From openssl rand -hex 16
ENCRYPTION_IV=your-16-char-iv    # From openssl rand -hex 8
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GROK_API_KEY=your-grok-key
GEMINI_API_KEY=your-gemini-key
```

- Ensure .env is complete

#### 5. Deploy to Vercel

```
vercel
```

#### Prompts:

- Project name: testnet-demo (or accept default).
- Scope: Your account or team.
- Directory: . (root).

Output:

```bash
Vercel CLI X.X.X
> Deploying testnet-demo
> Building project...
> Deployed to https://testnet-demo.vercel.app
```

#### 6. Set Environment Variables in Vercel:

Why: Ensure production uses the same vars as local.

```bash
vercel env pull .env  # Pulls existing vars (if any)
vercel env add DATABASE_URL
vercel env add ENCRYPTION_KEY
vercel env add ENCRYPTION_IV
vercel env add OPENAI_API_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add GROK_API_KEY
vercel env add GEMINI_API_KEY
```

#### 7. Test Deployed Endpoints:

- https://testnet-demo.vercel.app

- Health Check:

```bash
curl https://testnet-demo.vercel.app/api/admin/health-check
```

- Diagnose keys

```bash
curl https://testnet-demo.vercel.app/api/admin/diagnose-keys
```

- Broadcast

```bash
curl -X POST -H "Content-Type: application/json" -d '{"queryText":"Is the sky blue?"}' https://testnet-demo.vercel.app/api/broadcast
```

- https://testnet-demo.vercel.app

---

## Helpful urls used with Supabase

### Local development

```
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
```

---

### Linting and Prettifying

You can run format (writing) or check-format (non-writing) ot format the code to the default prettier style.

Prettier: https://prettier.io/docs/

```json
{
  "scripts": {
    "format": "prettier --write \"**/*.{js,ts,tsx,css,json,md}\"",
    "check-format": "prettier --check \"**/*.{js,ts,tsx,css,json,md}\""
  }
}
```

Examples:

Using the npm script above:

```bash
npm run format
npm run check-format
```

Without npm:

```bash
npx prettier --write "**/*.{js,ts,tsx,css,json,md}"
```

**Default Settings:** If you later want custom settings (e.g., 4-space indentation), add a .`prettierrc` file:

```json
{
  "tabWidth": 4,
  "singleQuote": true
}
```

### Remote development

---

### ENV file (local)

For local dev, deployed dev may be set in teh team Vercel account.
note: DATABASE_URL= should use the team account one, the `quuuhdbozcmhkwzhamuh` is a sample, that is the project reference given by Supabase, each team acct. has a different one, so find out yours and replace that with yours.

```
DATABASE_URL=postgresql://postgres:[supabase team acct. db password]@db.quuuhdbozcmhkwzhamuh.supabase.co:6543/postgres?pgbouncer=true
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
GROK_API_KEY=your-key
GEMINI_API_KEY=your-key
ENCRYPTION_KEY=your-32-character-key-here...  create with CLI: "openssl rand -hex 16"
ENCRYPTION_IV=your-16-character-iv-here... CLI: "openssl rand -hex 8"
```

## API Endpoints

### Broadcaster Service

- `POST /broadcast`: Trigger a broadcast with a random query
- `POST /broadcast/query`: Broadcast a specific query
- `POST /start`: Start automatic broadcasting
- `POST /stop`: Stop automatic broadcasting
- `GET /status`: Get broadcaster status

### Validator Service

- `POST /vote`: Process a vote request (used by leader)
- `GET /status`: Get validator status

### Web Application

- `GET /api/network`: Get network state
- `POST /api/broadcast`: Broadcast a new query to validators

## Consensus Mechanism

1. Queries are broadcast via Redis pub/sub to all validators
2. The leader validator (determined via Redis) collects votes from all validators
3. Consensus is calculated based on simple majority (customizable)
4. Results are stored in PostgreSQL for persistence
5. Leadership rotates after each consensus completion

## Overview

This migration is from @jbrace02's repo here: https://github.com/VerafyTechnologies/VerafyTestnet-J1

note: There is flow, testing and testing/troubleshooting detailed below.

The Verafy Testnet Demo is a modular system where the UI (Next.js) serves as the entry point, sending queries to the broadcaster service.

- The broadcaster distribute queries to validators, which vote using their AI models.
- The leader validator calculates consensus, stores results in PostgreSQL, and rotates leadership.
- The UI retrieves and displays these results via API endpoints.
- Admin tools monitor and repair the system.
- This flow ensures a scalable, verifiable AI validation network.

The system was created on Docker originally and worked great locally.
However there were some problems with deployments and setup time.
Also we wanted to take advantage of Postgres Supabase integration with Vercel for easier deployments, features, monitoring, etc.

- This repo is in the process of being migrated to Vercel/Supabase.

Reasons for migration:

- Simplified deployment workflow. Vercel allows one-click deploys from GitHub with little or no additional DevOps setup.

- Built-in serverless functions. For example, custom broadcaster endpoints can be with scalable edge functions.

- Integrated advanced PostgreSQL database. Supabase provides hosted, versioned Postgres with REST and GraphQL APIs.

- Supports easily changing the database, for example to other instances like toggling between dev and prod depending on env variable deploys.

- Real-time updates. Supabase supports subscriptions for live data sync, useful for validator results.

- Reduced hosting overhead. No need to manage Docker containers or VM instances manually or dealing with slow setup times..

- Built-in authentication. Removes need to manage custom auth logic across broadcaster and UI. Can manage this easier through Supabase.

- Improved observability. Vercel and Supabase offer dashboards and logs for fast debugging and performance insight.

- Edge caching and CDN support. Vercel serves UI and data from global edge locations for faster performance.

- Easier frontend-backend integration. Easier to connect Next.js frontend with Supabase backend using official SDKs.

### 1. Overview of Verafy Testnet

**What It Does:** Verafy Testnet is a distributed validator network designed to verify AI-generated content or decisions through a consensus mechanism. It allows multiple AI validators (e.g., from OpenAI, Anthropic, Google) to vote on queries, ensuring trustworthy outcomes.

**Flow:** The process starts when a user or system submits a query via the web application. This query is broadcast to a network of validators, which vote on its validity. The results are collected, consensus is determined, and the outcome is displayed to the user.

**UI to Services:** The user interacts with a Next.js-based web application, which sends requests to the broadcaster service. The broadcaster then distributes the query to validator services via Redis, and the results are stored in PostgreSQL for persistence and displayed back in the UI.

---

### 2. System Architecture

**What It Does:** The system uses a hybrid architecture combining real-time messaging (Redis), persistent storage (PostgreSQL), and modular services (broadcaster and validators) to handle query distribution, voting, and result tracking.

**Flow:** Queries enter through the broadcaster, which uses Redis to send them to validators in real-time. Validators process the query, vote, and send responses back through Redis. The leader validator aggregates votes, determines consensus, and stores results in PostgreSQL.

**UI to Services:** The UI communicates with the broadcaster via API endpoints (e.g., `/broadcast`). The broadcaster uses Redis pub/sub to coordinate with validators, and PostgreSQL ensures data durability, which the UI can later query for historical data.

---

### 3. Validator Network

**What It Does:** Validators are independent services representing different AI providers (e.g., OpenAI, Anthropic, Grok). They analyze queries and vote (YES/NO) with a rationale, contributing to the network’s consensus.

**Flow:** When a query is received, each validator processes it based on its AI model and configuration. The leader validator collects all votes, calculates consensus, and rotates leadership after each round.

**UI to Services:** The UI doesn’t directly interact with validators. Instead, it sends queries to the broadcaster, which relays them to validators via Redis. The leader validator then updates the database, and the UI retrieves the results through network state APIs.

---

### 4. Consensus Mechanism

**What It Does:** The system determines consensus based on a majority vote (customizable threshold, e.g., 60%). This ensures agreement among validators on a query’s validity.

**Flow:** After a query is broadcast, validators vote independently. The leader collects votes via Redis, counts YES/NO responses, and checks if the threshold is met. The result (consensus or no consensus) is stored and shared.

**UI to Services:** The UI triggers this by submitting a query to the `/broadcast` endpoint. The broadcaster initiates the voting process, and the leader validator finalizes the consensus, which the UI displays via the `/api/network` endpoint.

---

### 5. Broadcaster Service

**What It Does:** The broadcaster is a central service that distributes queries to validators and can operate in manual or automatic mode (e.g., scheduled broadcasts).

**Flow:** A query is received (manually via API or automatically via a cron job). The broadcaster publishes it to a Redis channel, which all validators subscribe to. It then waits for the leader to process the votes.

**UI to Services:** The UI sends a POST request to `/broadcast` with a query. The broadcaster service (running on Express) uses Redis to notify validators, and the UI later fetches the outcome from the network state API.

---

### 6. Web Application (Next.js Frontend)

**What It Does:** The web application provides a user-friendly interface to submit queries, monitor the network, and view voting results, built with Next.js for server-side rendering and API routes.

**Flow:** Users input a query on the frontend, which sends it to the broadcaster. The UI polls or receives updates on the network state (validator votes, consensus) and displays them in real-time.

**UI to Services:** The UI calls API endpoints like `/api/broadcast` to send queries and `/api/network` to fetch the current state. These endpoints interact with the broadcaster and database services to manage the flow.

---

### 7. Real-Time Communication with Redis

**What It Does:** Redis enables fast, real-time communication between the broadcaster and validators using a publish/subscribe (pub/sub) model.

**Flow:** The broadcaster publishes a query to a Redis channel. Validators, subscribed to this channel, receive the query instantly and respond with their votes. The leader uses Redis to coordinate and collect these responses.

**UI to Services:** The UI indirectly uses Redis by sending queries to the broadcaster, which handles the pub/sub communication. The UI doesn’t interact with Redis directly but benefits from its speed in displaying results.

---

### 8. Persistent Storage with PostgreSQL

**What It Does:** PostgreSQL stores validator information, vote sessions, and results, ensuring data is preserved across sessions and can be queried later.

**Flow:** After voting, the leader validator saves the session (query, votes, consensus) to PostgreSQL. The UI or admin tools can retrieve this data for analysis or display.

**UI to Services:** The UI accesses stored data via API endpoints like `/api/network`, which query PostgreSQL through Prisma (an ORM). The broadcaster and validators update the database during operation.

---

### 9. API Key Management and Diagnostics

**What It Does:** The system manages API keys for AI providers (e.g., OpenAI) and includes diagnostic tools to ensure keys are encrypted, linked to validators, and functional.

**Flow:** Admin endpoints (`/api/admin/diagnose-keys`, `/api/admin/repair-keys`) check key status, decrypt them for validation, and fix issues (e.g., re-encrypting or linking to validators). This ensures validators can access their AI services.

**UI to Services:** The UI (admin section) calls these endpoints to monitor and repair keys. The services interact with PostgreSQL to update key records and validators to test connectivity.

---

### 10. Health Monitoring

**What It Does:** A health-check endpoint (`/api/admin/health-check`) monitors the system’s status, including validator activity, API key decryption, and recent votes.

**Flow:** The endpoint queries the database for active validators, tests key decryption, and checks the latest vote session. It returns a status (healthy, warning, error) with details.

**UI to Services:** The UI calls `/api/admin/health-check` to display system health. The service queries PostgreSQL and tests key services, returning results for the UI to render.

---

### 11. Testing and Validation

**What It Does:** The system includes test scripts and endpoints (e.g., `/api/test-validators`) to verify validator functionality with real AI integrations.

**Flow:** A test query is sent to specific validators (e.g., OpenAI, Anthropic), which process it and return votes. Results are logged or displayed to confirm integration works.

**UI to Services:** The UI or a script sends a POST request to `/api/test-validators` with a test query. The endpoint creates validator instances, calls their APIs, and returns responses for verification.

---

### 12. Deployment with Docker Compose

**What It Does:** Docker Compose simplifies deployment by running all services (PostgreSQL, Redis, broadcaster, validators, web app) in containers with a single command.

**Flow:** Running `docker-compose up` starts the database, Redis, broadcaster, five validator instances, and the Next.js app. They communicate via internal networking, and the UI becomes accessible at `localhost:3000`.

**UI to Services:** The UI runs in a container and connects to the broadcaster and database services via predefined ports and environment variables. Validators and the broadcaster use Redis and PostgreSQL within the Docker network.

---

### Summary

The Verafy Testnet is a modular system where the UI (Next.js) serves as the entry point, sending queries to the broadcaster service. The broadcaster uses Redis to distribute queries to validators, which vote using their AI models. The leader validator calculates consensus, stores results in PostgreSQL, and rotates leadership. The UI retrieves and displays these results via API endpoints. Admin tools monitor and repair the system, while Docker Compose streamlines deployment. This flow ensures a scalable, verifiable AI validation network.

## Flow

### Query to Validator Flow

- **User Submits Query via UI**

  - File: `app/api/broadcast/route.ts`
  - Action: User enters a query in the Next.js web app, which sends a POST request to `/api/broadcast` with the query text (e.g., "Is AI beneficial?").

- **API Route Triggers Broadcast**

  - File: `app/api/broadcast/route.ts`
  - Action: The route receives the request, calls `broadcastCustomQuery` from `app/actions.ts`, and passes the query.

- **Broadcast Custom Query Initiates**

  - File: `app/actions.ts` (function: `broadcastCustomQuery`)
  - Action: Creates a unique session ID, logs the query in PostgreSQL via Prisma, and retrieves active validators from the database.

- **Validators Are Instantiated**

  - File: `app/actions.ts`
  - Action: Loops through active validators (from `validatorService`), creating instances (e.g., `OpenAIValidator`, `GrokValidator`) based on provider type defined in files like `lib/validators/providers/openai.ts`, `lib/validators/providers/grok.ts`.

- **Broadcaster Publishes Query**

  - File: `services/broadcaster/broadcaster.ts`
  - Action: The broadcaster (triggered indirectly via `app/actions.ts`) publishes the query to a Redis channel using `publishQuery` from `lib/redis.ts`.

- **Validators Subscribe and Receive Query**

  - File: `services/validator/validator.ts`
  - Action: Validators subscribe to the Redis channel via `subscribeToQueries` (from `lib/redis.ts`), receiving the query in real-time.

- **Leader Validator Coordinates Voting**

  - File: `services/validator/validator.ts` (function: `handleQuery`)
  - Action: The leader (determined via `getLeadershipData` in `lib/redis.ts`) processes its vote and requests votes from other validators via HTTP POST to their `/vote` endpoints.

- **Individual Validators Process Vote**

  - File: `services/validator/validator.ts` (route: `/vote`)
  - Action: Each validator receives the query, generates a vote (YES/NO) and rationale (via `generateRationale`), and returns the response to the leader.

- **Leader Collects and Calculates Consensus**

  - File: `services/validator/validator.ts` (function: `handleQuery`)
  - Action: The leader aggregates votes, calculates consensus (e.g., 60% threshold), and stores the session and responses in PostgreSQL via Prisma.

- **Results Persisted to Database**

  - File: `app/actions.ts` (within `broadcastCustomQuery`)
  - Action: Updates the vote session in PostgreSQL with consensus results and individual validator responses, linked to the session ID.

- **UI Retrieves Results**

  - File: `app/api/network/route.ts`
  - Action: The UI polls `/api/network`, which queries PostgreSQL for the latest vote session and validator responses, returning the network state.

- **Results Displayed to User**
  - File: Implicit in Next.js frontend (not explicitly shown, e.g., a component using `app/api/network/route.ts`)
  - Action: The web app renders the consensus outcome, vote counts, and validator rationales for the user.

---

### Summary of Key Files

- **UI Entry:** `app/api/broadcast/route.ts`
- **Core Logic:** `app/actions.ts`
- **Broadcaster:** `services/broadcaster/broadcaster.ts`
- **Validator:** `services/validator/validator.ts`
- **Validator Providers:** `lib/validators/providers/*.ts` (e.g., `openai.ts`, `grok.ts`)
- **Redis Communication:** Implicit in `lib/redis.ts` (assumed, referenced in broadcaster/validator)
- **Network State:** `app/api/network/route.ts`
- **Database:** Prisma interactions in `app/actions.ts` and `services/validator/validator.ts`

This flow ensures a query moves efficiently from user input to validator consensus and back to the UI, leveraging Redis for real-time communication and PostgreSQL for persistence.

# Supabase Postgres Backups

You may need to backup either remote or local.

Supabase has automated backups for a cost, including various levels like PITR (Point in Time).

However, you can also manually backup the remote to local.

### REMOTE DB to LOCAL FILESYTEM backup

This produces a dump file of the entire database.

1. First make sure you have Postgres and pg_dump installed locally.

MacOS instructions.

```bash
brew install postgresql@15
brew --prefix postgresql@15
```

You may need to change this if the atrget server has a different version. As of most recent update this was the correct version.

⚠️ Update your path just for this terminal session only

```
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```

Verify:

```bash
pg_dump --version
```

Run it (you may need to change variables, this was accurate at some point).
If you are unsure go to the supabase dashboard "connect" circular issues from foreign keys, you may see a warning but we're already following the advice.

```bash
PGPASSWORD="your_password" pg_dump \
  -h aws-0-us-east-1.pooler.supabase.com \
  -U postgres.quuuhdbozcmhkwzhamuh \
  -p 5432 \
  -d postgres \
  -F c \
  -f 20250530-remote_supabase_backup.dump

```

or (may need to update variables)

```bash
pg_dump -h aws-0-us-east-1.pooler.supabase.com -U postgres.quuuhdbozcmhkwzhamuh -p 5432 -d postgres -F c -f 20250509-remote_supabase_backup.dump
```

Restore (only use if db is new in another location):

```bash
pg_restore --disable-triggers --clean --create --no-owner -U your_local_postgres_user -d your_target_db supabase_backup.dump

```

Optional: Make PostgreSQL 15 the default

```bash
brew unlink postgresql@14
brew link postgresql@15 --force
```

## Enabling Realtime Subscriptions in Supabase

Docs: https://supabase.com/docs/guides/realtime

Example (you may have to adjust based on your actual table names and schema):

Go to our project
https://supabase.com/dashboard/project/quuuhdbozcmhkwzhamuh/database/publications

Look for the supabase_realtime publication, which is the default for real-time features. It may show "0 tables" or list currently enabled tables.

* Under the supabase_realtime publication, locate the Source or Tables section.
* Click to edit the publication or select Source.
* Find the VoteSession table in the list (ensure it’s in the public schema).
* Toggle the switch next to VoteSession to enable it.
* Confirm that Insert, Update, and Delete events are enabled for VoteSession.
* Verify that VoteSession appears in the list of enabled tables under the publication.

You can verify in SQL Editor:

```sql
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';
```

(The above is an example, you may need to adjust based on your actual table names and schema.)

## Troubleshooting and Testing

⚠️ IMPORTANT: Make sure the app is running locally `npm run dev`. Also, if testing local data (not remote) then make sure that is in the .env and/or available for what you need.

### Test script

You can run this script from `npm run qa` (make sure to do in a new terminal apart from where you are running `npm run dev`)

Or manually run the script from your root directory to run a variety of tests below.

```
npx ts-node --project ./tsconfig.scripts.json test/test-qa.ts
```

This should give you output like:

```
$ npx ts-node --project ./tsconfig.scripts.json test/test-qa.ts
Testing /api/admin/health-check...
Health Check: 200 {
  status: 'error',
  message: 'API key decryption is failing',
  details: {
    apiKeysCount: 4,
    activeValidatorsCount: 4,
    validatorsWithKeysCount: 4,
    lastVoteTimestamp: '2025-04-04T19:42:31.826Z',
    decryptionSuccess: false
  }
}
Testing /api/vote-history?limit=10...
Vote History: 200 10 sessions
Testing /api/vote-history?limit=5...
Vote History: 200 5 sessions
Testing /api/vote-history...
Vote History: 200 10 sessions
Testing /api/broadcast with query: "Is the sky blue?"...
Broadcast: 200 {
  id: 'dda7ce9c-6f44-4c60-96cb-706fe60b642b',
  isConsensusReached: true,
  consensusValue: false,
  queryText: 'Is the sky blue?',
  validatorResponses: [
    {
      id: '31a0275e-0703-493a-8a2e-b58ab117b92a',
      provider: 'Google',
      profileName: 'GEMINI Validator',
      vote: 'NO',
      rationale: 'Error: Gemini API error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent: [400 Bad Request] API key not valid. Please pass a valid API key. [{"@type":"type.googleapis.com/google.rpc.ErrorInfo","reason":"API_KEY_INVALID","domain":"googleapis.com","metadata":{"service":"generativelanguage.googleapis.com"}},{"@type":"type.googleapis.com/google.rpc.LocalizedMessage","locale":"en-US","message":"API key not valid. Please pass a valid API key."}]'
    },
```

If you get "undefined" for several or all tests, it may mean your app is not running.

### Manual Testing

#### Test directory

The test directory has some scripts.

For .ts files you may need to run:

`node --experimental-specifier-resolution=node test-transaction.mjs`

Others are .js files so run normally.

Also `npm run qa` runs some qa tests.

#### Health Check Endpoint

`curl http://localhost:3000/api/admin/health-check`

### Vote History Endpoint (/api/vote-history)

#### Vote History, Default Limit (10):

`curl http://localhost:3000/api/vote-history?limit=10`

Array of up to 10 vote sessions (from your 56 in Supabase).

#### Vote History, Custom Limit

`curl http://localhost:3000/api/vote-history?limit=5`

Array of 5 vote sessions.

#### Vote History, Invalid Limit (Error Case):

`curl http://localhost:3000/api/vote-history?limit=abc`

Expected: `{"error":"Invalid limit parameter"} `or similar (depends on parsing).

#### Vote History, No Limit

`curl http://localhost:3000/api/vote-history`

Array of 10 vote sessions (default).

### Broadcast Endpoint (/api/broadcast)

#### Broadcast Endpoint valid query

`curl -X POST -H "Content-Type: application/json" -d '{"queryText":"Is the sky blue?"}' http://localhost:3000/api/broadcast`

Expected: `{"id":"uuid","isConsensusReached":true,"queryText":"Is the sky blue?","validatorResponses":[...],"votingResult":{"yes":X,"no":Y,"notVoted":Z},"timestamp":"..."}`

#### Broadcast Endpoint, Empty Query (Edge Case)

`curl -X POST -H "Content-Type: application/json" -d '{"queryText":""}' http://localhost:3000/api/broadcast`

Expected: Valid response (empty string is allowed) or `{"error":"Query text cannot be empty"}` if you add validation.

#### Broadcast Endpoint, Missing QueryText (Error Case):

`curl -X POST -H "Content-Type: application/json" -d '{"queryText":""}' http://localhost:3000/api/broadcast`

Expected: `{"error":"Query text is required"} `(add this check if missing).

#### Invalid JSON (Error Case):

`curl -X POST -H "Content-Type: application/json" -d '{}' http://localhost:3000/api/broadcast`

### Network Endpoint (/api/network)

#### Network, Basic Fetch:

`curl http://localhost:3000/api/network`

Expected: `{"validators":[...],"currentLeaderIndex":X,"isVoting":false,...} `(depends on implementation).

#### Credits

- ⚠️ note: You must input a valid wallet public key for this to work in the spot where it says: "your-test-public-key""

```bash
curl -X POST http://localhost:3000/api/credits/assign \
-H "Content-Type: application/json" \
-d '{"walletPublicKey":"your-test-public-key","creditAmount":10,"email":"test@example.com"}'
```

---

---

## Diagnostics

### Supabase Diagnostics

| name                   | title                  | level | facing   | categories      | description                                                                                         | detail                                                                                                                                                  | remediation                                                                                | metadata                                                                                                             | cache_key                                                                    |
| ---------------------- | ---------------------- | ----- | -------- | --------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| unindexed_foreign_keys | Unindexed foreign keys | INFO  | EXTERNAL | ["PERFORMANCE"] | Identifies foreign key constraints without a covering index, which can impact database performance. | Table \`public.GraphEdge\` has a foreign key \`GraphEdge_validatorId_fkey\` without a covering index. This can lead to suboptimal query performance.    | https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys | {"name":"GraphEdge","type":"table","schema":"public","fkey_name":"GraphEdge_validatorId_fkey","fkey_columns":[10]}   | unindexed_foreign_keys_public_GraphEdge_GraphEdge_validatorId_fkey           |
| unindexed_foreign_keys | Unindexed foreign keys | INFO  | EXTERNAL | ["PERFORMANCE"] | Identifies foreign key constraints without a covering index, which can impact database performance. | Table \`public.GraphEdge\` has a foreign key \`GraphEdge_voteSessionId_fkey\` without a covering index. This can lead to suboptimal query performance.  | https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys | {"name":"GraphEdge","type":"table","schema":"public","fkey_name":"GraphEdge_voteSessionId_fkey","fkey_columns":[11]} | unindexed_foreign_keys_public_GraphEdge_GraphEdge_voteSessionId_fkey         |
| unindexed_foreign_keys | Unindexed foreign keys | INFO  | EXTERNAL | ["PERFORMANCE"] | Identifies foreign key constraints without a covering index, which can impact database performance. | Table \`public.Reply\` has a foreign key \`Reply_threadId_fkey\` without a covering index. This can lead to suboptimal query performance.               | https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys | {"name":"Reply","type":"table","schema":"public","fkey_name":"Reply_threadId_fkey","fkey_columns":[6]}               | unindexed_foreign_keys_public_Reply_Reply_threadId_fkey                      |
| unindexed_foreign_keys | Unindexed foreign keys | INFO  | EXTERNAL | ["PERFORMANCE"] | Identifies foreign key constraints without a covering index, which can impact database performance. | Table \`public.Thread\` has a foreign key \`Thread_voteSessionId_fkey\` without a covering index. This can lead to suboptimal query performance.        | https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys | {"name":"Thread","type":"table","schema":"public","fkey_name":"Thread_voteSessionId_fkey","fkey_columns":[8]}        | unindexed_foreign_keys_public_Thread_Thread_voteSessionId_fkey               |
| unindexed_foreign_keys | Unindexed foreign keys | INFO  | EXTERNAL | ["PERFORMANCE"] | Identifies foreign key constraints without a covering index, which can impact database performance. | Table \`public.ValidatorKey\` has a foreign key \`ValidatorKey_apiKeyId_fkey\` without a covering index. This can lead to suboptimal query performance. | https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys | {"name":"ValidatorKey","type":"table","schema":"public","fkey_name":"ValidatorKey_apiKeyId_fkey","fkey_columns":[3]} | unindexed_foreign_keys_public_ValidatorKey_ValidatorKey_apiKeyId_fkey        |
| unused_index           | Unused Index           | INFO  | EXTERNAL | ["PERFORMANCE"] | Detects if an index has never been used and may be a candidate for removal.                         | Index \`ApiKey_provider_isActive_idx\` on table \`public.ApiKey\` has not been used                                                                     | https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index           | {"name":"ApiKey","type":"table","schema":"public"}                                                                   | unused_index_public_ApiKey_ApiKey_provider_isActive_idx                      |
| unused_index           | Unused Index           | INFO  | EXTERNAL | ["PERFORMANCE"] | Detects if an index has never been used and may be a candidate for removal.                         | Index \`GraphEdge_relationship_idx\` on table \`public.GraphEdge\` has not been used                                                                    | https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index           | {"name":"GraphEdge","type":"table","schema":"public"}                                                                | unused_index_public_GraphEdge_GraphEdge_relationship_idx                     |
| unused_index           | Unused Index           | INFO  | EXTERNAL | ["PERFORMANCE"] | Detects if an index has never been used and may be a candidate for removal.                         | Index \`GraphEdge_sourceType_sourceId_idx\` on table \`public.GraphEdge\` has not been used                                                             | https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index           | {"name":"GraphEdge","type":"table","schema":"public"}                                                                | unused_index_public_GraphEdge_GraphEdge_sourceType_sourceId_idx              |
| unused_index           | Unused Index           | INFO  | EXTERNAL | ["PERFORMANCE"] | Detects if an index has never been used and may be a candidate for removal.                         | Index \`GraphEdge_targetType_targetId_idx\` on table \`public.GraphEdge\` has not been used                                                             | https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index           | {"name":"GraphEdge","type":"table","schema":"public"}                                                                | unused_index_public_GraphEdge_GraphEdge_targetType_targetId_idx              |
| unused_index           | Unused Index           | INFO  | EXTERNAL | ["PERFORMANCE"] | Detects if an index has never been used and may be a candidate for removal.                         | Index \`ValidatorResponse_matchedConsensus_idx\` on table \`public.ValidatorResponse\` has not been used                                                | https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index           | {"name":"ValidatorResponse","type":"table","schema":"public"}                                                        | unused_index_public_ValidatorResponse_ValidatorResponse_matchedConsensus_idx |
| unused_index           | Unused Index           | INFO  | EXTERNAL | ["PERFORMANCE"] | Detects if an index has never been used and may be a candidate for removal.                         | Index \`ValidatorResponse_validatorId_idx\` on table \`public.ValidatorResponse\` has not been used                                                     | https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index           | {"name":"ValidatorResponse","type":"table","schema":"public"}                                                        | unused_index_public_ValidatorResponse_ValidatorResponse_validatorId_idx      |
| unused_index           | Unused Index           | INFO  | EXTERNAL | ["PERFORMANCE"] | Detects if an index has never been used and may be a candidate for removal.                         | Index \`ValidatorResponse_vote_idx\` on table \`public.ValidatorResponse\` has not been used                                                            | https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index           | {"name":"ValidatorResponse","type":"table","schema":"public"}                                                        | unused_index_public_ValidatorResponse_ValidatorResponse_vote_idx             |
| unused_index           | Unused Index           | INFO  | EXTERNAL | ["PERFORMANCE"] | Detects if an index has never been used and may be a candidate for removal.                         | Index \`Validator_active_idx\` on table \`public.Validator\` has not been used                                                                          | https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index           | {"name":"Validator","type":"table","schema":"public"}                                                                | unused_index_public_Validator_Validator_active_idx                           |
| unused_index           | Unused Index           | INFO  | EXTERNAL | ["PERFORMANCE"] | Detects if an index has never been used and may be a candidate for removal.                         | Index \`Validator_provider_idx\` on table \`public.Validator\` has not been used                                                                        | https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index           | {"name":"Validator","type":"table","schema":"public"}                                                                | unused_index_public_Validator_Validator_provider_idx                         |
| unused_index           | Unused Index           | INFO  | EXTERNAL | ["PERFORMANCE"] | Detects if an index has never been used and may be a candidate for removal.                         | Index \`VoteSession_consensusValue_idx\` on table \`public.VoteSession\` has not been used                                                              | https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index           | {"name":"VoteSession","type":"table","schema":"public"}                                                              | unused_index_public_VoteSession_VoteSession_consensusValue_idx               |
| unused_index           | Unused Index           | INFO  | EXTERNAL | ["PERFORMANCE"] | Detects if an index has never been used and may be a candidate for removal.                         | Index \`VoteSession_isConsensusReached_idx\` on table \`public.VoteSession\` has not been used                                                          | https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index           | {"name":"VoteSession","type":"table","schema":"public"}                                                              | unused_index_public_VoteSession_VoteSession_isConsensusReached_idx           |


----------------------

# New Relic

To integrate New Relic with Vercel and a Next.js application for enhanced logging and performance monitoring, follow these steps based on the latest available information:

### Prerequisites
- A New Relic account with a valid license key.
- A Vercel account with a deployed Next.js application.
- Node.js and npm installed locally for development.

### Steps to Integrate New Relic

1. **Install the New Relic Node.js Agent**
   - In your Next.js project, install the New Relic Node.js agent by running:
     ```bash
     npm install newrelic
     ```
   - This package allows New Relic to monitor your application's performance.

2. **Configure New Relic**
   - Create a `newrelic.js` configuration file in the root of your Next.js project. You can generate this file by copying the default template provided by New Relic:
     ```bash
     cp node_modules/newrelic/newrelic.js .
     ```
   - Update the `newrelic.js` file with your New Relic license key and application name. For example:
     ```javascript
     'use strict'
     exports.config = {
       app_name: ['Your Next.js App Name'],
       license_key: 'YOUR_NEW_RELIC_LICENSE_KEY',
       logging: {
         level: 'info'
       },
       application_logging: {
         enabled: true
       }
     }
     ```
   - Replace `YOUR_NEW_RELIC_LICENSE_KEY` with your actual New Relic license key from your New Relic account.
   - Optionally, configure additional settings like logging levels or distributed tracing based on your needs. Refer to New Relic’s documentation for advanced options.

3. **Modify Your Next.js Application**
   - Ensure the New Relic agent is loaded at the start of your application. For Next.js running on Vercel, you typically need to integrate it with the server runtime.
   - If using a custom server or API routes, require the New Relic agent at the top of your server entry point (e.g., in `pages/api` or a custom server file). For example, in an API route (`pages/api/example.js`):
     ```javascript
     require('newrelic');
     export default function handler(req, res) {
       res.status(200).json({ message: 'Hello from API' });
     }
     ```
   - For server-side rendering (SSR) or static site generation (SSG), the agent will automatically track performance metrics if loaded correctly.

4. **Set Environment Variables in Vercel**
   - In your Vercel dashboard, navigate to your project’s **Settings** > **Environment Variables**.
   - Add the following environment variables:
     - `NEW_RELIC_LICENSE_KEY`: Your New Relic license key.
     - `NEW_RELIC_APP_NAME`: The name of your application (e.g., `Your Next.js App`).
     - Optional: `NEW_RELIC_NO_CONFIG_FILE` set to `true` if you prefer to configure New Relic via environment variables instead of the `newrelic.js` file. If so, add additional variables like:
       - `NEW_RELIC_LOG_LEVEL`: Set to `info` or desired level.
       - `NEW_RELIC_APPLICATION_LOGGING_ENABLED`: Set to `true` to enable application logging.
   - Example environment variables in Vercel:
     ```
     NEW_RELIC_LICENSE_KEY=your_license_key_here
     NEW_RELIC_APP_NAME=Your Next.js App
     NEW_RELIC_NO_CONFIG_FILE=true
     NEW_RELIC_LOG_LEVEL=info
     NEW_RELIC_APPLICATION_LOGGING_ENABLED=true
     ```
   - Redeploy your Vercel project after adding these variables to apply the changes.

5. **Enable Vercel Log Integration (Optional)**
   - Vercel provides a New Relic integration to send logs directly to New Relic for centralized log management.
   - In your Vercel dashboard:
     - Go to **Integrations** > **Browse Marketplace**.
     - Search for **New Relic** and select the integration.
     - Follow the prompts to connect your New Relic account, providing your New Relic API key or license key as required.
     - Configure the integration to send logs from your Vercel project to New Relic.
   - This integration allows you to view Vercel deployment logs, function logs, and runtime logs in New Relic’s Logs UI.

6. **Deploy to Vercel**
   - Push your updated Next.js project to your Git repository linked to Vercel (e.g., GitHub, GitLab).
   - Vercel will automatically build and deploy your application with the New Relic agent included.
   - Ensure the `newrelic.js` file is included in your repository (unless you’re using environment variables exclusively).

7. **Verify in New Relic**
   - After deployment, log in to your New Relic account.
   - Navigate to **APM & Services** to confirm that your application (`Your Next.js App Name`) appears and is reporting data.
   - Check **Logs** in New Relic to verify that Vercel logs (if integrated) and application logs are being received.
   - Monitor metrics like response times, error rates, and throughput to ensure the agent is tracking performance correctly.

### Additional Considerations
- **Serverless Environment**: Vercel uses a serverless architecture, so the New Relic agent primarily tracks API routes, serverless functions, and SSR requests. Some metrics (e.g., CPU usage) may not be available in a serverless context.
- **Performance Impact**: The New Relic agent adds minimal overhead, but test thoroughly in a staging environment to ensure it doesn’t affect your application’s performance.
- **Browser Monitoring**: To monitor client-side performance (e.g., page load times), you can add New Relic’s Browser agent. This requires injecting a JavaScript snippet into your Next.js application:
  - In New Relic, go to **Browser** > **Add a new application**, and follow the instructions to copy the JavaScript code.
  - Add the snippet to your Next.js app, typically in a custom `_document.js` or via a `<Head>` component in `_app.js`. For example:
    ```javascript
    import Head from 'next/head';

    export default function MyApp({ Component, pageProps }) {
      return (
        <>
          <Head>
            <script
              type="text/javascript"
              dangerouslySetInnerHTML={{ __html: `/* Your New Relic Browser JS Snippet Here */` }}
            />
          </Head>
          <Component {...pageProps} />
        </>
      );
    }
    ```
- **Troubleshooting**:
  - If data isn’t appearing in New Relic, verify that the license key and environment variables are correct.
  - Check Vercel’s deployment logs for errors related to the New Relic agent.
  - Ensure the `newrelic` module is included in your `package.json` dependencies, not `devDependencies`.

### Resources
- [New Relic Node.js Agent Documentation](https://docs.newrelic.com/docs/apm/agents/nodejs-agent/)
- [Vercel Integrations Marketplace](https://vercel.com/integrations)
- [New Relic Vercel Integration Guide](https://docs.newrelic.com/docs/logs/integrations/vercel-integration/)
- [Next.js Documentation](https://nextjs.org/docs)

