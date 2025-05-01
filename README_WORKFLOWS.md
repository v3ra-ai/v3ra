

---

### Workflow: User Submits a Query and Receives a Response

Below is the workflow outlining how a user navigates to the "ask" page, enters a query, broadcasts it to multiple LLMs, and receives a response.

1. **User navigates to the "ask" page**
   - The page loads the UI for entering queries (`ask/page.tsx`).

2. **The page displays the query input interface**
   - A form or input field is rendered for the user to type their query (`components/ask/query-interface.tsx`).

3. **User enters a query and submits it**
   - The user types a question and clicks a submit button (`components/ask/query-interface.tsx`).

4. **Submission logic processes the query**
   - The input is captured and prepared for broadcasting (`hooks/useQueryLogic.tsx`).

5. **The query is sent to a broadcasting function**
   - The submission triggers a function to handle broadcasting (`hooks/useBroadcastQuery.ts`).

6. **The query is transmitted to the server**
   - A POST request sends the query to an API endpoint (`app/api/broadcast-query/route.ts`).

7. **The server initiates the broadcasting process**
   - The API calls a function to distribute the query to LLMs (`app/actions.ts`).

8. **Active LLMs are retrieved from the database**
   - The system fetches a list of available validators (LLMs) (`lib/services/validatorService.ts`).

9. **Validator instances are created for each LLM**
   - Objects are instantiated for each LLM provider (e.g., `lib/validators/providers/openai.ts`).

10. **Each LLM processes the query**
    - Validators send the query to their respective LLM APIs (e.g., OpenAI, Anthropic).

11. **Responses from LLMs are collected**
    - The system gathers all LLM outputs for analysis (`app/actions.ts`).

12. **Consensus is determined from the responses**
    - The responses are evaluated to check for agreement (`app/actions.ts`).

13. **The results are saved to the database**
    - The query, responses, and consensus are stored (`app/actions.ts`).

14. **The consensus result is sent back to the client**
    - The server returns the final result to the browser (`app/api/broadcast-query/route.ts`).

15. **The UI displays the response to the user**
    - The result is shown, and network state/history may refresh (`hooks/useBroadcastQuery.ts`, `components/ask/ask-results-expert.tsx`).

---


Below are two workflows addressing your query: one for making a Solana payment when a user exceeds their available queries, and another for buying credits, adding them to the database, and confirming them in the app. Each workflow includes the steps, files involved, and database interactions.

---

### Solana Payment When Exceeding Available Queries

This workflow describes what happens when a user tries to submit a query but lacks sufficient queries, prompting a Solana payment.

1. **User attempts to submit a query**
   - The user tries to broadcast a query through the interface.
   - File: `components/ask/query-interface.tsx`

2. **System checks available queries**
   - The app checks the user’s available query count.
   - File: `hooks/useQueryLogic.tsx`

3. **Insufficient queries detected**
   - If the query count is too low, a payment prompt is displayed.
   - File: `components/ask/payment-controls.tsx`

4. **User starts payment process**
   - The user clicks to pay using their Solana wallet.
   - File: `hooks/useSolanaTransaction.tsx`

5. **Payment amount is calculated**
   - The app determines the SOL amount based on queries needed.
   - Files: `lib/constants.ts`, `lib/solana-constants.ts`

6. **Solana transaction is generated**
   - A transaction is created for the payment.
   - File: `hooks/useSolanaTransaction.tsx`

7. **User signs the transaction**
   - The user approves it via their Solana wallet.
   - File: `components/solana-provider.tsx`

8. **Transaction is broadcasted**
   - The signed transaction is sent to the Solana blockchain.
   - File: `hooks/useSolanaTransaction.tsx`

9. **Confirmation is awaited**
   - The app waits for blockchain confirmation.
   - File: `hooks/useSolanaTransaction.tsx`

10. **Server verifies payment**
    - The server checks the transaction status using Solana RPC.
    - File: `app/api/payment/route.ts`

11. **Credits are added**
    - Credits are assigned to the user’s account after verification.
    - File: `app/api/credits/assign/route.ts`

12. **Payment logged in database**
    - Payment details are recorded.
    - Database: `PaymentLog` table (`prisma/schema.prisma`)

13. **Credit balance updated**
    - The user’s credit balance is updated.
    - Database: `UserCredit` table (`prisma/schema.prisma`)

14. **UI refreshes balance**
    - The app updates the displayed credit balance.
    - File: `hooks/useCreditBalance.tsx`

15. **Query submission enabled**
    - The user can now submit their query with sufficient credits.
    - File: `components/ask/query-interface.tsx`

---

### Buying Credits and Confirming in the App

This workflow explains how a user purchases credits, how they’re added to the database, and how the app confirms the purchase.

1. **User accesses credits page**
   - The user navigates to the credits purchase section.
   - File: `credits/page.tsx`

2. **User selects credit amount**
   - The user picks how many credits to buy.
   - File: `components/credits/credit-slider.tsx`

3. **Payment amount calculated**
   - The SOL cost is computed based on the selected credits.
   - File: `lib/constants.ts`

4. **User initiates payment**
   - The user clicks to proceed with payment.
   - File: `components/credits/credit-slider.tsx`

5. **Transaction is prepared**
   - A Solana transaction is created for the amount.
   - File: `hooks/useSolanaTransaction.tsx`

6. **User signs transaction**
   - The user approves it in their Solana wallet.
   - File: `components/solana-provider.tsx`

7. **Transaction sent to Solana**
   - The transaction is broadcasted to the blockchain.
   - File: `hooks/useSolanaTransaction.tsx`

8. **Confirmation is checked**
   - The app waits for blockchain confirmation.
   - File: `hooks/useSolanaTransaction.tsx`

9. **Server verifies payment**
   - The server confirms the transaction via Solana RPC.
   - File: `app/api/payment/route.ts`

10. **Credits assigned**
    - Purchased credits are added to the user’s account.
    - File: `app/api/credits/assign/route.ts`

11. **Payment recorded**
    - Payment details are logged.
    - Database: `PaymentLog` table (`prisma/schema.prisma`)

12. **Credit balance updated**
    - The user’s credit balance is updated in the database.
    - Database: `UserCredit` table (`prisma/schema.prisma`)

13. **App updates balance**
    - The UI refreshes to reflect the new credit balance.
    - File: `hooks/useCreditBalance.tsx`

14. **Purchase confirmed**
    - A success message confirms the credit purchase.
    - File: `components/credits/credit-slider.tsx`

15. **Credits ready for use**
    - The user can now use the credits for queries.
    - File: `components/ask/query-interface.tsx`

---


# Verafy Testnet Workflows

## Solana Payment When Exceeding Available Queries

1. **User attempts to submit a query**
   - File: `components/ask/query-interface.tsx`
2. **System checks available queries**
   - File: `hooks/useQueryLogic.tsx`
3. **Insufficient queries detected**
   - File: `components/ask/payment-controls.tsx`
4. **User starts payment process**
   - File: `hooks/useSolanaTransaction.tsx`
5. **Payment amount is calculated**
   - Files: `lib/constants.ts`, `lib/solana-constants.ts`
6. **Solana transaction is generated**
   - File: `hooks/useSolanaTransaction.tsx`
7. **User signs the transaction**
   - File: `components/solana-provider.tsx`
8. **Transaction is broadcasted**
   - File: `hooks/useSolanaTransaction.tsx`
9. **Confirmation is awaited**
   - File: `hooks/useSolanaTransaction.tsx`
10. **Server verifies payment**
    - File: `app/api/payment/route.ts`
11. **Credits are added**
    - File: `app/api/credits/assign/route.ts`
12. **Payment logged in database**
    - Database: `PaymentLog` table (`prisma/schema.prisma`)
13. **Credit balance updated**
    - Database: `UserCredit` table (`prisma/schema.prisma`)
14. **UI refreshes balance**
    - File: `hooks/useCreditBalance.tsx`
15. **Query submission enabled**
    - File: `components/ask/query-interface.tsx`

## Buying Credits and Confirming in the App

1. **User accesses credits page**
   - File: `credits/page.tsx`
2. **User selects credit amount**
   - File: `components/credits/credit-slider.tsx`
3. **Payment amount calculated**
   - File: `lib/constants.ts`
4. **User initiates payment**
   - File: `components/credits/credit-slider.tsx`
5. **Transaction is prepared**
   - File: `hooks/useSolanaTransaction.tsx`
6. **User signs transaction**
   - File: `components/solana-provider.tsx`
7. **Transaction sent to Solana**
   - File: `hooks/useSolanaTransaction.tsx`
8. **Confirmation is checked**
   - File: `hooks/useSolanaTransaction.tsx`
9. **Server verifies payment**
   - File: `app/api/payment/route.ts`
10. **Credits assigned**
    - File: `app/api/credits/assign/route.ts`
11. **Payment recorded**
    - Database: `PaymentLog` table (`prisma/schema.prisma`)
12. **Credit balance updated**
    - Database: `UserCredit` table (`prisma/schema.prisma`)
13. **App updates balance**
    - File: `hooks/useCreditBalance.tsx`
14. **Purchase confirmed**
    - File: `components/credits/credit-slider.tsx`
15. **Credits ready for use**
    - File: `components/ask/query-interface.tsx`



API calls that involve database reads or changes.

# API Calls Involving Database Reads or Changes

## 1. Fetching Vote History (`/api/vote-history`)
- **API Call**: GET request to `/api/vote-history` with an optional `limit` parameter.
- **Processing**:
  - Handled by `app/api/vote-history/route.ts`.
  - Calls `getHistoricalVoteSessions` from `lib/store.ts`.
  - Queries the database using Prisma (`prisma.voteSession.findMany`).
- **Database Interaction**:
  - Reads from `VoteSession` and `ValidatorResponse` tables.
  - Retrieves the latest vote sessions based on the `limit`.
- **Response**:
  - Formats the fetched vote sessions as JSON and returns them.
  - Client receives the JSON and updates the UI with the vote history.

## 2. Broadcasting a Query (`/api/broadcast-query`)
- **API Call**: POST request to `/api/broadcast-query` with query text in the body.
- **Processing**:
  - Validated and CSRF-checked in `app/api/broadcast-query/route.ts`.
  - Calls `broadcastCustomQuery` from `app/actions.ts`.
  - Fetches active validators from the database.
  - Each validator processes the query and provides a response.
- **Database Interaction**:
  - Creates a new record in the `VoteSession` table.
  - Logs each validator’s response in the `ValidatorResponse` table.
  - Updates the `VoteSession` with the consensus result.
- **Response**:
  - Returns the consensus result as JSON.
  - Client receives the JSON and updates the UI with the vote result.

## 3. Assigning Credits (`/api/credits/assign`)
- **API Call**: POST request to `/api/credits/assign` with wallet public key and credit amount.
- **Processing**:
  - Validated in `app/api/credits/assign/route.ts`.
  - Uses Prisma to add credits to the user’s account.
- **Database Interaction**:
  - Upserts the `UserCredit` record to reflect the new credit balance.
  - Logs the payment in the `PaymentLog` table.
- **Response**:
  - Returns the updated credit balance as JSON.
  - Client receives the JSON and refreshes the credit balance in the UI.

## 4. Fetching Credit Balance (`/api/credits/balance`)
- **API Call**: POST request to `/api/credits/balance` with wallet public key.
- **Processing**:
  - Handled by `app/api/credits/balance/route.ts`.
  - Fetches the user’s credit balance from the database.
- **Database Interaction**:
  - Reads from the `UserCredit` table.
- **Response**:
  - Returns the credit balance as JSON.
  - Client receives the JSON and displays the current balance.

## 5. Processing a Payment (`/api/payment`)
- **API Call**: POST request to `/api/payment` with transaction details.
- **Processing**:
  - Validated and CSRF-checked in `app/api/payment/route.ts`.
  - Verifies the transaction using Solana’s RPC.
- **Database Interaction**:
  - Logs payment details in the `PaymentLog` table.
  - Updates the `UserCredit` table if the payment is successful.
- **Response**:
  - Returns the payment status as JSON.
  - Client receives the JSON, confirms the payment, and updates the UI.

## 6. Fetching Network State (`/api/network`)
- **API Call**: GET request to `/api/network`.
- **Processing**:
  - Handled by `app/api/network/route.ts`.
  - Fetches the current network state from the database.
- **Database Interaction**:
  - Reads from the `Validator` and `VoteSession` tables.
- **Response**:
  - Returns the network state as JSON.
  - Client receives the JSON and updates the network visualization and status.














Below is a detailed workflow for the API call involved in fetching validators, focusing on the process from the API call to database interactions and how the response is processed and returned to the client. This is tailored for dev documentation, written concisely for the CTO, and includes relevant filenames from the provided code. Since the task involves a single API call, I’ll provide a focused set of bullet points to cover the workflow comprehensively.

---

### Workflow: Fetching Validators (`/api/validators`)

- **API call initiated**
  - A GET request is sent to `/api/validators` to retrieve the list of active validators.
  - File: `app/api/validators/route.ts`

- **Request validated**
  - The server validates the request and checks for CSRF protection.
  - File: `utils/security.ts`

- **Database query executed**
  - The server calls a service to fetch active validators from the database using Prisma.
  - Files: `lib/services/validatorService.ts`, `prisma/schema.prisma`

- **Validators retrieved**
  - The database returns records from the `Validator` table, including details like provider and status.
  - File: `prisma/schema.prisma`

- **Data formatted**
  - The retrieved validator data is formatted into a JSON response.
  - File: `app/api/validators/route.ts`

- **Response sent to client**
  - The server sends the JSON containing the list of validators back to the client.
  - File: `app/api/validators/route.ts`

- **Client processes response**
  - The client receives the JSON and updates the UI or internal state with the validator list.
  - File: `hooks/useNetworkState.tsx`

---

## Fetching Validators (`/api/validators`)
List of active validators for display or further processing.

- **API call initiated**
  - A GET request is sent to `/api/validators`.
  - File: `app/api/validators/route.ts`
- **Request validated**
  - The server validates the request and checks for CSRF protection.
  - File: `utils/security.ts`
- **Database query executed**
  - The server fetches active validators using Prisma.
  - Files: `lib/services/validatorService.ts`, `prisma/schema.prisma`
- **Validators retrieved**
  - Records are returned from the `Validator` table.
  - File: `prisma/schema.prisma`
- **Data formatted**
  - Validator data is formatted into JSON.
  - File: `app/api/validators/route.ts`
- **Response sent to client**
  - The server sends the JSON to the client.
  - File: `app/api/validators/route.ts`
- **Client processes response**
  - The client updates the UI or state with the validator list.
  - File: `hooks/useNetworkState.tsx`
