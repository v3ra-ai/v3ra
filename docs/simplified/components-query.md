
## Analysis of Each File

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

