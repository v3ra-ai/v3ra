
# hooks/useBroadcastQuery.ts

### What This Code Does: A Simple Explanation

This code is a helper tool (called a "hook") in a web app that sends user questions or tasks (called "queries") to the app’s system for processing. It’s like the part of the app that takes a user’s question, sends it to a server (a computer that handles requests), and saves the answer. It also checks if the user has enough credits to send the query and keeps track of votes on the answers. Think of it as a messenger who delivers your question and brings back the response.

Here’s what it does, step by step:

---

#### 1. **Sends User Queries to the Server**
- The main job of this code is to take a user’s query (like a question or task) and send it to the app’s server for processing.
- It sends details like:
  - The query text (what the user typed).
  - The query mode (what kind of question it is, like a search or a vote).
  - How many queries the user wants to send at once.
- It uses a secure connection to make sure the query is sent safely.

---

#### 2. **Checks User Credits**
- Queries cost "credits" (like tokens in a game), and this code checks if the user has enough credits to send the query.
- It looks at:
  - **Free credits**: Credits the app gives for free.
  - **Paid credits**: Credits the user bought.
- If the query is marked as "free" (meaning it uses free credits), it skips the credit check because another part of the app already handled it.
- If the user doesn’t have enough credits, it shows an error message like, "You don’t have enough credits!"

---

#### 3. **Fetches User’s Email**
- When the app starts, the code checks if the user is logged in by looking for their email address.
- It uses a tool called Supabase (a service that manages user accounts) to get the email.
- If it can’t find the email, it logs an error for developers but keeps running.

---

#### 4. **Gets a Security Code**
- To keep things safe, the code fetches a special security code (called a CSRF token) before sending the query.
- This code acts like a secret password to prove the request is coming from the real app, not a hacker.
- If it can’t get the security code, it logs an error and stops the query.

---

#### 5. **Handles the Server’s Response**
- After sending the query, the server sends back an answer (called a "vote result") or an error.
- The code checks if the response is valid:
  - If it’s a proper answer (a vote result), it saves it as the user’s latest result and adds it to their history of results.
  - If it’s an error (like "Server is busy"), it shows an error message to the user, like, "Something went wrong."
- It keeps only a limited number of past results (like the last 10) to avoid clutter.

---

#### 6. **Updates Voting Records**
- The app lets users vote on query results (like giving a thumbs-up or thumbs-down).
- This code saves:
  - The latest vote result (the most recent answer the user got).
  - The user’s history of vote results (all their past answers).
- It updates these records every time a query is successfully sent and answered.

---

#### 7. **Refreshes App Data**
- After sending a query, the code updates the app by:
  - Refreshing the user’s credit balance (to show how many credits are left).
  - Checking the app’s network status (to make sure everything is connected).
  - Updating the user’s vote history (to include the new result).
- It tries these updates once, and if they fail, it waits a second and tries again (up to a set number of tries).

---

#### 8. **Shows Feedback to Users**
- The code uses pop-up messages (called "toasts") to tell users what’s happening:
  - If there’s a problem (like not enough credits or a server error), it shows a red error message, like, "Not enough credits."
- These messages disappear after a few seconds.

---

#### 9. **Connects to a Cryptocurrency Wallet**
- The code checks if the user has a cryptocurrency wallet (like Solana) connected.
- It uses the wallet’s ID (called a public key) to track the user’s credits and update their balance after a query.

---

### Summary of Features
- Sends user queries to the server for processing.
- Checks if the user has enough credits (unless it’s a free query).
- Fetches the user’s email to confirm they’re logged in.
- Gets a security code to keep the query safe.
- Saves the server’s response (vote result) and updates the user’s vote history.
- Refreshes the app’s data (credits, network status, vote history).
- Shows error messages if something goes wrong.
- Works with a cryptocurrency wallet to track user info.

---

This code is like a delivery service for user queries. It makes sure the query is sent safely, checks credits, saves the answer, and keeps the app updated with the latest info. It’s designed to be secure and user-friendly, with clear messages when things go wrong.

---


# hooks/useBroadcastQuery.ts

## What This Code Does: A Simple Explanation

This code is a helper tool (called a "hook") in a web app that sends user questions or tasks (called "queries") to the app’s system for processing. It’s like the part of the app that takes a user’s question, sends it to a server (a computer that handles requests), and saves the answer. It also checks if the user has enough credits to send the query and keeps track of votes on the answers. Think of it as a messenger who delivers your question and brings back the response.

Here’s what it does, step by step:

### 1. Sends User Queries to the Server
- Takes a user’s query (like a question or task) and sends it to the app’s server.
- Sends details like the query text, query mode (e.g., search or vote), and number of queries.
- Uses a secure connection to ensure safety.

### 2. Checks User Credits
- Queries cost "credits" (like game tokens).
- Checks free credits (given by the app) and paid credits (bought by the user).
- Skips credit check for "free" queries (handled elsewhere).
- Shows an error like, "You don’t have enough credits!" if credits are low.

### 3. Fetches User’s Email
- Checks if the user is logged in by getting their email using Supabase (a user account tool).
- Logs an error for developers if the email isn’t found but continues running.

### 4. Gets a Security Code
- Fetches a security code (CSRF token) to prove the query is from the real app, not a hacker.
- Logs an error and stops the query if it can’t get the code.

### 5. Handles the Server’s Response
- Receives the server’s answer (a "vote result") or an error.
- Saves valid answers as the latest result and adds them to the user’s history.
- Shows an error message like, "Something went wrong," for invalid responses.
- Keeps only a limited number of past results (e.g., the last 10).

### 6. Updates Voting Records
- Saves the latest vote result and the user’s history of vote results.
- Updates these records after each successful query.

### 7. Refreshes App Data
- Updates the user’s credit balance, network status, and vote history after a query.
- Retries updates once if they fail, waiting a second between tries.

### 8. Shows Feedback to Users
- Uses pop-up "toast" messages to show errors (e.g., "Not enough credits") in red.
- Messages disappear after a few seconds.

### 9. Connects to a Cryptocurrency Wallet
- Checks if a cryptocurrency wallet (like Solana) is connected.
- Uses the wallet’s ID to track and update the user’s credits.

## Summary of Features
- Sends queries to the server.
- Checks credits (unless free query).
- Fetches user’s email for login.
- Gets a security code for safety.
- Saves and updates vote results.
- Refreshes app data (credits, network, votes).
- Shows error messages.
- Works with a cryptocurrency wallet.

This code is like a delivery service for queries, ensuring safe sending, credit checks, answer saving, and app updates, with clear error messages.
