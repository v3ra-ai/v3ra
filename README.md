# testnet-demo
Testnet Vercel/Supabase migration


## Overview

This is migration is from @jbrace02's repo here: https://github.com/VerafyTechnologies/VerafyTestnet-J1

note: There is flow, testing and troubleshooting detailed below.

The Verafy Testnet Demo is a modular system where the UI (Next.js) serves as the entry point, sending queries to the broadcaster service.

* The broadcaster distribute queries to validators, which vote using their AI models.
* The leader validator calculates consensus, stores results in PostgreSQL, and rotates leadership.
* The UI retrieves and displays these results via API endpoints.
* Admin tools monitor and repair the system.
* This flow ensures a scalable, verifiable AI validation network.

The system was created on Docker originally and worked great locally, however we hit some problems with deployments and setup time. Also we wanted to take advantage of Postgres Supabase integration with Vercel for easier deployments, features, monitoring, etc.

It is in the process of being migrated to Vercel/Supabase.

Reasons for migration:

* Simplified deployment workflow. Vercel allows one-click deploys from GitHub with little or no additional DevOps setup.

* Built-in serverless functions. For example, custom broadcaster endpoints can be with scalable edge functions.

* Integrated advanced PostgreSQL database. Supabase provides hosted, versioned Postgres with REST and GraphQL APIs.

* Supports easily changing the database, for example to other instances like toggling between dev and prod depending on env variable deploys.

* Real-time updates. Supabase supports subscriptions for live data sync, useful for validator results.

* Reduced hosting overhead. No need to manage Docker containers or VM instances manually or dealing with slow setup times..

* Built-in authentication. Removes need to manage custom auth logic across broadcaster and UI. Can manage this easier through Supabase.

* Improved observability. Vercel and Supabase offer dashboards and logs for fast debugging and performance insight.

* Edge caching and CDN support. Vercel serves UI and data from global edge locations for faster performance.

* Easier frontend-backend integration. Easier to connect Next.js frontend with Supabase backend using official SDKs.


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



## Troubleshooting and Testing

⚠️ IMPORTANT: Make sure the app is running locally `npm run dev`. Also, if testing local data (not remote) then make sure that is in the .env and/or available for what you need.

### Test script

From root you can run a variety of test below.

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


-----------



