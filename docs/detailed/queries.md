

## Analysis Query related Files

### 1. QueryFormAISlider.tsx
**What It Does**: This file creates a slider tool that lets users choose how many AI queries (questions or tasks) they want to send at once. It’s like a volume knob for queries, with buttons to increase or decrease the number.

**Key Features**:
- **Slider Control**: Shows a movable slider where users can pick a number of queries (e.g., 1 to 10).
- **Number Display**: Shows the chosen number with text like "Query 5 AIs".
- **Plus/Minus Buttons**: On larger screens, includes "+" and "−" buttons to adjust the number by 1.
- **Limits**: Ensures the number stays within allowed limits (e.g., can’t go below 1 or above the max allowed).
- **Styling**: Looks good in both light and dark modes, with rounded buttons and clear visuals.

**How It Works**: The slider updates the number of queries when moved, and the buttons (if visible) let users fine-tune the number. It sends the chosen number to the app to calculate costs or process queries.

---

### 2. QueryFormInput.tsx
**What It Does**: This file builds the main input form where users type their query and submit it. It’s like a search bar with extra controls to pick the query type and number of queries.

**Key Features**:
- **Text Box**: A box where users type their query, with a placeholder (e.g., "Ask something…").
- **Query Mode Selector**: Includes a dropdown to choose the query type (e.g., Fact Check, Predict, Shop).
- **AI Slider**: Includes the slider from `QueryFormAISlider` to pick how many queries to send.
- **Submit Button**: A button to send the query, which changes text based on the query type (e.g., "Fact Check").
- **Credit Check**: Before submitting, checks if the user has enough credits; if not, shows an error like, "Not enough credits!"
- **Feedback**: Shows error messages if submission fails (e.g., "Try again").
- **Timer**: Starts a timer when submitting to update the button text (e.g., to show it’s processing).

**How It Works**: Users type a query, pick a mode and number of queries, and click submit. The code checks credits, sends the query to the app, and shows feedback. It disables the submit button if the user lacks credits or while processing.

---

### 3. QueryFormModeSelector.tsx
**What It Does**: This file creates a dropdown menu that lets users choose the type of query they want to send, like Fact Check, Predict, or Shop. It’s like a menu to pick what kind of question you’re asking.

**Key Features**:
- **Dropdown Button**: Shows the current query type (e.g., "Fact Check") and opens a menu when clicked.
- **Menu Options**: Lists options like Fact Check, Predict, and Shop, each linking to a different page (e.g., "/ask/fact-check").
- **Styling**: Looks clean in light and dark modes, with hover effects for usability.
- **Logging**: Logs the current query type for developers to debug.

**How It Works**: Users click the button to see query types, then click an option to switch modes, which takes them to the right page. The button updates to show the selected mode.

---

### 4. QueryForm.tsx
**What It Does**: This file acts as a wrapper that connects the `QueryFormInput` component to the app’s logic. It’s like a middleman that passes data to the input form.

**Key Features**:
- **Data Pass-Through**: Takes data like the query text, credits, and query mode, and sends it to `QueryFormInput`.
- **Sets Max Queries**: Passes a constant for the maximum allowed queries (e.g., 10).
- **Simple Structure**: Just calls `QueryFormInput` with all the needed data.

**How It Works**: It ensures the input form gets all the info it needs (like credits and query text) to work properly. It’s a simple file that ties things together.

---

### 5. QueryInterface.tsx
**What It Does**: This file builds the main page where users interact with the query system. It’s like the dashboard that holds the query form, results, and other tools.

**Key Features**:
- **Query Form**: Includes the `QueryForm` component for typing and submitting queries.
- **Mode Toggle**: A button to switch between viewing modes (e.g., standard or expert results).
- **Wallet Toggle**: A tool to switch between paying with credits or a cryptocurrency wallet.
- **Query Stats**: Shows credit balance and query costs (from `QueryStats`).
- **Query Results**: Displays query results (from `QueryResults`), like answers or predictions.
- **Mode Popover**: A clickable menu to switch query types (e.g., Fact Check, Predict), similar to `QueryFormModeSelector`.
- **Error Display**: Shows error messages if something goes wrong (e.g., "Failed to submit").
- **Logic Connection**: Uses `useQueryLogic` to handle credits, submissions, and query modes.

**How It Works**: It combines all the pieces (form, stats, results) into one page. Users type queries, pick modes, and see results, with tools to manage payments and view stats.

---

### 6. QueryResults.tsx
**What It Does**: This file shows the results of user queries, like answers or predictions. It’s like the part of the app that displays what the AI found.

**Key Features**:
- **View Modes**: Supports two ways to show results: standard (simple view) or expert (detailed view).
- **Dynamic Display**: Shows `AskResultsStandard` or `AskResultsExpert` based on the view mode.
- **Client-Side Setup**: Sets the view mode to "standard" when the page loads and waits for the page to fully load before showing results (to avoid errors).
- **Logging**: Logs the view mode and loading status for debugging.

**How It Works**: When the page loads, it sets the standard view and shows either simple or detailed results based on the user’s choice. It ensures the app doesn’t try to show results before it’s ready.

---

### 7. QueryStats.tsx
**What It Does**: This file displays the user’s credit balance and query costs, like a bank statement for the app. It’s like a status bar showing how many tokens you have and what queries cost.

**Key Features**:
- **Credit Display**: Shows how many credits are left (e.g., "Credits left: 5").
- **Query Cost**: Shows the cost of the current query in credits and cryptocurrency (e.g., "5 credits, 0.05 SOL").
- **Collapsible (Mobile)**: On phones, hides details in a collapsible section that opens when tapped.
- **Always Visible (Desktop)**: On computers, shows all details without collapsing.
- **Buttons**: Includes buttons to buy credits or stake for rewards, linking to another page.
- **Email Fetch**: Gets the user’s email to check their account.
- **Credit Fetch**: Updates the credit balance when the page loads or changes.
- **Loading Spinner**: Shows a spinning icon while credits are loading.
- **Auto-Open**: Opens the collapsible section if the user owes credits (unpaid queries).

**How It Works**: It shows the user’s credits and query costs, updating when needed. On mobile, it saves space with a collapsible section; on desktop, everything is visible. It fetches user data to keep info accurate.

---

## Summary of How They Work Together
These files create a complete system for users to ask questions (queries) in a web app, pay for them with credits or cryptocurrency, and see results. Here’s how they fit together:

- **QueryInterface.tsx** is the main page, combining the query form, stats, and results into one place. It uses `useQueryLogic` (from a previous file) to manage credits, submissions, and modes.
- **QueryForm.tsx** and **QueryFormInput.tsx** build the form where users type queries, pick modes (via **QueryFormModeSelector.tsx**), and choose how many queries to send (via **QueryFormAISlider.tsx**). They check credits and handle submissions.
- **QueryFormModeSelector.tsx** lets users switch query types (e.g., Fact Check, Predict), updating the app’s behavior.
- **QueryStats.tsx** shows credit and cost info, helping users track their balance and decide if they need more credits.
- **QueryResults.tsx** displays the answers, switching between simple and detailed views based on user preference.

Together, they form a user-friendly interface where someone can type a question, choose how to ask it, pay for it, and see the results, with clear feedback about costs and credits. The system is designed to be secure, visually appealing, and easy to use on both phones and computers.

---


# Query System Files Summary

## Analysis of Each File

### 1. QueryFormAISlider.tsx
**Purpose**: Creates a slider for users to select how many AI queries to send.
**Features**:
- Slider to pick query count (e.g., 1–10).
- Displays chosen number (e.g., "Query 5 AIs").
- "+" and "−" buttons on large screens to adjust count.
- Ensures number stays within allowed limits.
- Styled for light/dark modes.
**How It Works**: Updates query count when slider moves or buttons are clicked, sending the number to the app.

### 2. QueryFormInput.tsx
**Purpose**: Builds the main form for typing and submitting queries.
**Features**:
- Text box for query with placeholder.
- Dropdown for query mode (e.g., Fact Check).
- Slider for query count.
- Submit button with dynamic text (e.g., "Fact Check").
- Checks credits before submitting; shows errors if insufficient.
- Shows error messages for failed submissions.
- Uses a timer to update button text during submission.
**How It Works**: Users type query, pick mode/count, and submit. Checks credits, sends query, and shows feedback.

### 3. QueryFormModeSelector.tsx
**Purpose**: Provides a dropdown to choose query type (e.g., Fact Check, Predict).
**Features**:
- Button shows current mode; opens menu on click.
- Menu lists query types, linking to pages (e.g., "/ask/fact-check").
- Styled for light/dark modes with hover effects.
- Logs mode for debugging.
**How It Works**: Users select a mode, which updates the app and navigates to the right page.

### 4. QueryForm.tsx
**Purpose**: Connects `QueryFormInput` to app logic.
**Features**:
- Passes data (query text, credits, mode) to `QueryFormInput`.
- Sets maximum query limit.
**How It Works**: Ensures `QueryFormInput` has all needed data, acting as a simple connector.

### 5. QueryInterface.tsx
**Purpose**: Creates the main page for query interactions.
**Features**:
- Includes query form, mode toggle, wallet toggle, stats, and results.
- Popover menu to switch query modes.
- Shows errors if submission fails.
- Uses `useQueryLogic` for credits and submissions.
**How It Works**: Combines all components into a dashboard for typing queries, managing payments, and viewing results.

### 6. QueryResults.tsx
**Purpose**: Displays query results (answers or predictions).
**Features**:
- Supports standard (simple) or expert (detailed) view modes.
- Shows `AskResultsStandard` or `AskResultsExpert` based on mode.
- Sets standard mode on load; waits for full load to avoid errors.
- Logs view mode for debugging.
**How It Works**: Shows results in chosen format after page loads, switching between simple/detailed views.

### 7. QueryStats.tsx
**Purpose**: Shows user’s credit balance and query costs.
**Features**:
- Displays credits left and query cost (credits and SOL).
- Collapsible on mobile; always visible on desktop.
- Buttons to buy credits or stake for rewards.
- Fetches email and credits on load.
- Shows loading spinner while credits load.
- Auto-opens collapsible if unpaid queries exist.
**How It Works**: Updates and displays credit/cost info, with mobile-friendly collapsible view and links to manage credits.

## How They Work Together
These files form a system for users to submit queries, pay with credits or cryptocurrency, and view results.
- **QueryInterface.tsx** is the main page, integrating form, stats, and results, using `useQueryLogic` for logic.
- **QueryForm.tsx** and **QueryFormInput.tsx** create the query form, with mode selection (`QueryFormModeSelector.tsx`) and query count slider (`QueryFormAISlider.tsx`).
- **QueryFormModeSelector.tsx** switches query types.
- **QueryStats.tsx** tracks credits and costs.
- **QueryResults.tsx** shows results in standard or expert format.
Together, they provide a secure, user-friendly interface for querying, paying, and viewing results, working on phones and computers.


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


# useQueryLogic.tsx

as of June 6, 2025

### Summary of Features
- Lets users type and submit queries.
- Checks if users have enough credits or switches to wallet payment.
- Fetches user info (email and credits) when the app starts.
- Submits queries securely and deducts credits.
- Tracks user votes on query results.
- Lets users choose how many queries to send.
- Shows clear success or error messages.
- Keeps everything safe by checking for harmful input and using security codes.

---

### What This Code Does: A Simple Explanation

This code is part of a web app that lets users submit questions or tasks (called "queries") and pays for them using either "credits" (like app currency) or a cryptocurrency wallet. It handles everything needed to let users type a query, check if they have enough credits, submit the query, and track their votes on query results. Think of it like the brain behind a "submit" button for a search or question feature.

Here’s what it does, step by step:

---

#### 1. **Tracks What the User Types**
- The code creates a box where users can type their query (like a question or task).
- It remembers what the user types and shows a placeholder (like "Type your question here") based on what kind of query the app expects (e.g., a search or a vote).
- If the user tries to submit an empty query, it shows an error message like, "You forgot to type something!"

---

#### 2. **Checks User Credits**
- Users need "credits" to submit queries (think of credits like tokens in an arcade).
- The code checks how many credits the user has:
  - **Free credits**: Credits the app gives for free.
  - **Paid credits**: Credits the user bought.
  - **Total credits**: Free + paid credits combined.
- When a user wants to submit a query, the code makes sure they have enough credits to cover the cost. For example, if a query costs 5 credits and the user has only 3, it shows an error like, "You don’t have enough credits!"

---

#### 3. **Connects to a Cryptocurrency Wallet**
- Users can choose to pay for queries with a cryptocurrency wallet (like Solana) instead of credits if they don’t have enough credits.
- The code checks if the user’s wallet is connected and decides whether to use the wallet or credits based on how many credits are left.
- If the user needs to pay with their wallet, it automatically switches to wallet mode and tells the user.

---

#### 4. **Fetches User Info**
- When the app starts, the code checks if the user is logged in by looking for their email address.
- If the user isn’t logged in, it shows a message like, "Please log in to get free credits."
- It also grabs the user’s credit balance (free and paid credits) but only does this once to avoid slowing down the app.

---

#### 5. **Submits the Query**
- When the user clicks "submit," the code does the following:
  - **Checks the query**: Makes sure the query isn’t empty and the user has enough credits.
  - **Gets a security code**: Fetches a special code (called a CSRF token) to make sure the submission is safe and not from a hacker.
  - **Deducts credits**: Takes away the right number of credits from the user’s account (free credits first, then paid credits).
  - **Sends the query**: Sends the query to the app’s system to process (like sending a question to a teacher).
  - **Updates the app**: Refreshes the user’s credit balance and clears the query box so they can type a new one.
- If everything works, it shows a success message like, "Query sent! 5 credits used."
- If something goes wrong (like not enough credits or a connection issue), it shows an error message like, "Oops, something went wrong."

---

#### 6. **Handles Voting**
- The app lets users vote on query results (like thumbs-up or thumbs-down on an answer).
- The code keeps track of:
  - All the user’s past votes.
  - The most recent vote they made.
- It updates these records when the user votes on a query result.

---

#### 7. **Lets Users Choose Query Amount**
- Users can choose how many queries to send at once (like submitting one question or five).
- The code makes sure the number is reasonable (e.g., between 1 and a max limit, like 10).
- It calculates the total cost based on how many queries the user wants to send and checks if they have enough credits.

---

#### 8. **Keeps Things Secure**
- The code cleans up the user’s query text to make sure it’s safe (e.g., no harmful code).
- It retries fetching the security code (CSRF token) up to three times if it fails, waiting a second between tries.
- If it can’t get the security code, it shows an error and stops the submission.

---

#### 9. **Shows Feedback to Users**
- The code uses pop-up messages (called "toasts") to tell users what’s happening:
  - Success messages (green) when a query is submitted.
  - Error messages (red) when something goes wrong, like not enough credits or a login issue.
- These messages disappear after a few seconds.

---

#### 10. **Checks the Website URL**
- The code looks at the website’s address (URL) to see if there’s a special instruction (like "?q=shop").
- It logs this info to help developers understand what’s happening, but it doesn’t change how the app works.
