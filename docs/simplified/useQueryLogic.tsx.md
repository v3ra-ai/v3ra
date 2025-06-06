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
