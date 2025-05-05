
As of May 5, 2025



# Verafy Testnet Payment Flow

## Overview
The Verafy Testnet payment system enables users to purchase credits (1 credit = 0.00001 SOL) or pay for queries using Solana. It integrates frontend components, custom hooks, a Zustand store, and backend APIs.

## Flow Steps

### 1. User Initiates Credit Purchase
- **Where**: `/credits/` page (`CreditsLayout` → `CreditSlider`).
- **Action**: User connects Solana wallet and selects credits (1–100) via slider.
- **UI**: Shows credits, SOL cost (0.00001 SOL/credit), credit/SOL balances.
- **Store**: `useCreditsStore` tracks `userFreeCredits` (10), `userPaidCredits` (0), `userCreditsTotal`.

### 2. Wallet Connection and Balance Check
- **Hooks**: `useWallet`, `useCreditBalance` (fetches from `/api/credits/balance`), `CreditSlider` (SOL balance).
- **Validation**: Ensures `creditAmount` is 1–100, sufficient SOL.
- **Store**: `userCreditsTotal` used for display.

### 3. Transaction Creation
- **Hook**: `useSolanaTransaction`.
- **Action**: “Pay Now” triggers transaction to `VERAFY_WALLET`.
- **Process**: Creates `SystemProgram.transfer` (credits * 0.00001 SOL), signs, sends, confirms with retries.
- **Output**: `{ signature, signedTx }`.

### 4. Payment Verification
- **Hook**: `useCreditAssignment`.
- **Action**: Sends transaction to `/api/payment`.
- **Backend**: Validates transaction, recipient, amount, signatures; logs to `PaymentLog`.
- **Output**: Success response or error.

### 5. Credit Assignment
- **Hook**: `useCreditAssignment`.
- **Action**: Calls `/api/credits/assign`.
- **Backend**: Upserts `UserCredit`, logs to `PaymentLog`.
- **Frontend**: Updates `creditBalance`, shows success toast.
- **Store**: May update `userPaidCredits` (recommended).

### 6. Query Payment
- **Where**: `WalletToggle` → `PaymentControls`.
- **Action**: Pay with SOL for `queriesUnpaid`.
- **Process**: Sends SOL to `PAYMENT_RECIPIENT`, resets credits via `resetCreditsAfterPayment`.
- **Store**: Sets `userFreeCredits`, `userPaidCredits`, `userCreditsTotal` to 0.

### 7. Balance Display
- **Where**: `NavbarCredits`, `CreditSliderUI`, `WalletToggle`.
- **Action**: Fetches/displays balances from `/api/credits/balance` and `useCreditsStore`.

## Notes
- **Staking**: `StakeSlider` disabled.
- **Security**: CSRF, Zod, retries.
- **Issues**: Duplicate hook, potential store desync, hardcoded RPC.
- **Improvements**: Remove duplicate, sync store, implement staking, ensure atomicity.


---------------


### **Overview**
The Verafy Testnet payment system enables users to:
1. Connect a Solana wallet and purchase credits (1 credit = `QUERY_COST` SOL, now defined as 0.00001 SOL).
2. Use credits or SOL to pay for queries, with free and paid credits tracked separately.
3. View and manage credit balances, with transactions processed securely on the Solana blockchain.
4. Stake SOL for credits (though this feature is disabled).

The system integrates frontend components (e.g., sliders, toggles), custom hooks (e.g., for Solana transactions and credit management), a Zustand store for credit state, and backend API routes for transaction processing and database updates. The `lib/constants.ts` file defines key parameters like `QUERY_COST` and default credit values, while `store/credit-store.ts` manages the state of free and paid credits.

---

### **Key Components and Their Roles**

#### **New Files**
1. **`store/credit-store.ts`**
   - A Zustand store for managing credit state (`CreditsStore`).
   - Tracks:
     - `userFreeCredits`: Free credits (default: 10, from `USER_FREE_CREDITS_DEFAULT`).
     - `userPaidCredits`: Paid credits (default: 0, from `USER_PAID_CREDITS_DEFAULT`).
     - `userCreditsTotal`: Sum of free and paid credits.
   - Provides actions:
     - `decrementFreeCredits`: Reduces free credits, ensuring non-negative values.
     - `decrementPaidCredits`: Reduces paid credits, ensuring non-negative values.
     - `incrementPaidCredits`: Increases paid credits (e.g., after purchase).
     - `resetCreditsAfterPayment`: Resets all credits to 0 after a SOL payment for queries.
   - Used by `components/ask/payment-controls.tsx` to reset credits and by other components to display or update credit balances.

2. **`lib/constants.ts`**
   - Defines configuration constants for the application.
   - Key constants for payments:
     - `QUERY_COST`: 0.00001 SOL per credit.
     - `QUERY_COST_FIXED_DECIMALS`: Dynamically calculated decimal places for `QUERY_COST` (5 for 0.00001).
     - `USER_FREE_CREDITS_DEFAULT`: 10 free credits for new users.
     - `USER_PAID_CREDITS_DEFAULT`: 0 paid credits initially.
     - `CURRENT_SOLANA_NETWORK_RPC`: Solana RPC URL (Devnet or Mainnet, based on `NEXT_PUBLIC_CURRENT_SOLANA_NETWORK_NAME`).
   - Other constants relate to queries (e.g., `ALLOWED_AMOUNT_QUERIES`) and voting, but are less relevant to payments.

#### **Previously Provided Components**
- **Frontend Components**:
  - `app/credits/page.tsx`: Renders the credits page with `CreditsLayout` and `SolanaProvider`.
  - `components/credits/credits-layout.tsx`: Displays `CreditSlider` and `StakeSlider`.
  - `components/credits/credit-slider.tsx`: Manages credit purchases using hooks.
  - `components/credits/credit-slider-ui.tsx`: UI for credit selection and payment.
  - `components/credits/stake-slider.tsx`: Disabled staking UI.
  - `components/ask/wallet-toggle.tsx`: Toggles between SOL and credit payments.
  - `components/ask/payment-controls.tsx`: Processes SOL payments for queries, resetting credits via `useCreditsStore`.
  - `components/ask/navbar-credits.tsx`: Displays credit balance in the navbar.

- **Custom Hooks**:
  - `hooks/useSolanaTransaction.tsx`: Creates and sends Solana transactions.
  - `hooks/useCreditAssignment.tsx`: Assigns credits post-transaction.
  - `hooks/useCreditBalance.tsx`: Fetches credit balance from `/api/credits/balance`.
  - `hooks/useSolanaWallet.tsx`: Duplicate of `useSolanaTransaction.tsx` (redundant).

- **Backend API Routes**:
  - `app/api/credits/assign/route.ts`: Assigns credits to a wallet.
  - `app/api/credits/balance/route.ts`: Retrieves credit balance.
  - `app/api/payment/route.ts`: Verifies and logs Solana transactions.

---

### **Payment Flow**

#### **1. User Initiates Credit Purchase**
- **Where**: `/credits` page (`app/credits/page.tsx` → `CreditsLayout` → `CreditSlider`).
- **Action**: User connects a Solana wallet using `WalletMultiButton`.
- **UI**:
  - `CreditSlider` renders `CreditSliderUI`, showing a slider for selecting credits (0–100).
  - Displays:
    - Selected credits (`creditAmount`).
    - Cost in SOL (`creditAmount * QUERY_COST`, formatted to `QUERY_COST_FIXED_DECIMALS` = 5 decimals).
    - Credit balance (from `useCreditBalance`).
    - SOL balance (fetched via `connection.getBalance`).
  - Button shows “Connect Wallet” if not connected, “Pay Now” if valid, or is disabled if:
    - `creditAmount` is 0 or not 1–100.
    - Insufficient SOL (`solBalance < requiredSol`).
- **Store**: `useCreditsStore` provides `userCreditsTotal` for display in `WalletToggle` or other components.

#### **2. Wallet Connection and Balance Check**
- **Hook**: `useWallet` provides `publicKey`, `signTransaction`, and `connected` status.
- **Hook**: `useCreditBalance` fetches `creditBalance` from `/api/credits/balance` when `publicKey` changes.
  - Calls `/api/credits/balance` with `walletPublicKey`.
  - Sets `creditBalance` to 0 if no record exists or on error.
- **Hook**: `CreditSlider` fetches SOL balance using `connection.getBalance(publicKey)` (Devnet RPC).
- **Store**: `useCreditsStore` tracks `userFreeCredits` (default: 10) and `userPaidCredits` (default: 0).
  - `userCreditsTotal` is used to show available credits in `WalletToggle`.
- **Validation**:
  - `creditAmount` must be an integer between 1 and 100.
  - `solBalance >= requiredSol` (`creditAmount * 0.00001`).
  - If wallet is disconnected, `useWalletModal` prompts connection.

#### **3. Transaction Creation**
- **Hook**: `useSolanaTransaction` in `CreditSlider`.
- **Action**: User clicks “Pay Now,” triggering `handlePayment` in `CreditSlider`.
- **Process**:
  - Validates wallet connection, `creditAmount`, and SOL balance.
  - Calls `sendTransaction(creditAmount, VERAFY_WALLET)`:
    - Creates a `Transaction` with:
      - `ComputeBudgetProgram.setComputeUnitLimit` (700,000 units).
      - `ComputeBudgetProgram.setComputeUnitPrice` (500,000 microLamports).
      - `SystemProgram.transfer` to send `creditAmount * QUERY_COST * LAMPORTS_PER_SOL` (e.g., 10 credits = 0.0001 SOL = 100,000 lamports).
    - Sets `recentBlockhash` and `feePayer` (user’s `publicKey`).
    - Signs transaction using `signTransaction`.
    - Sends raw transaction to Solana Devnet (`CURRENT_SOLANA_NETWORK_RPC`) and confirms with “confirmed” commitment.
  - Retries up to 3 times on failure (e.g., network errors, blockhash expiration).
  - Returns `{ signature, signedTx }` on success.
- **Error Handling**:
  - Shows toasts for errors (e.g., `WalletSignTransactionError`, `SendTransactionError`).
  - Logs sanitized errors using `sanitizeError`.

#### **4. Payment Verification**
- **Hook**: `useCreditAssignment` in `CreditSlider`.
- **Action**: Calls `assignCredits(signature, signedTx, creditAmount, publicKey)` after successful transaction.
- **Process**:
  - Validates transaction’s SOL amount (`lamports === credits * QUERY_COST * 1_000_000_000`).
  - Sends POST to `/api/payment` with:
    - `transaction` (base64-encoded `signedTx`).
    - `signature`.
    - `credits`.
    - `userWallet` (public key).
  - **Backend** (`app/api/payment/route.ts`):
    - Verifies CSRF token (`verifyCsrfToken`).
    - Validates input with Zod (ensures valid public key, credits 1–100, etc.).
    - Checks user’s SOL balance (`connection.getBalance`).
    - Deserializes `transaction` and verifies:
      - Contains `SystemProgram.transfer` to `VERAFY_WALLET`.
      - Correct lamports (`credits * QUERY_COST * LAMPORTS_PER_SOL`).
      - Valid signatures and `recentBlockhash`.
    - Confirms transaction status with retries (up to 3 attempts) using `connection.getSignatureStatus`.
    - Logs to `PaymentLog` (Prisma):
      - Success: `status: "SUCCESS"`, `id: signature`.
      - Failure: `status: "FAILED"`, `error: message`, `id: UUID`.
    - Returns `{ status: "success", signature, credits, solAmount }` or error.
- **Store**: No direct interaction with `useCreditsStore` at this stage, as credit updates occur in the next step.

#### **5. Credit Assignment**
- **Hook**: `useCreditAssignment` continues.
- **Action**: Sends POST to `/api/credits/assign` with:
  - `walletPublicKey`.
  - `creditAmount`.
- **Backend** (`app/api/credits/assign/route.ts`):
  - Verifies CSRF token.
  - Validates input with Zod (`walletPublicKey` is a valid Solana public key, `creditAmount` is 1–100).
  - Upserts `UserCredit` record in Prisma:
    - Increments `credits` by `creditAmount` if record exists.
    - Creates new record with `credits: creditAmount` if none exists.
  - Logs to `PaymentLog`:
    - Success: `status: "ASSIGNED"`, `id: UUID`, `solAmount: creditAmount * QUERY_COST`.
    - Failure: `status: "FAILED"`, `error: message`.
  - Returns `{ success: true, credits: updatedCredit.credits }`.
- **Frontend**:
  - Updates `creditBalance` via `setCreditBalance` (from `useCreditBalance`).
  - Shows success toast: `${credits} credits added! New balance: ${assignData.credits}`.
- **Store**: `useCreditsStore` may be updated indirectly via `incrementPaidCredits` if integrated with `useCreditBalance` (not shown in provided code but implied).

#### **6. Query Payment Flow**
- **Where**: Query submission UI (e.g., via `WalletToggle` and `PaymentControls`).
- **Action**:
  - User toggles “Pay with Wallet” in `WalletToggle`.
  - If `queriesUnpaid > 0`, `PaymentControls` shows a “Pay” button.
- **Process** (`PaymentControls`):
  - Uses `useWallet` and `useConnection` to access `publicKey` and `sendTransaction`.
  - Creates a `SystemProgram.transfer` transaction:
    - Sends `queriesCostTotal * QUERY_COST * LAMPORTS_PER_SOL` to `PAYMENT_RECIPIENT`.
    - Sets `recentBlockhash` and `feePayer`.
  - Sends and confirms transaction on Solana Devnet.
  - On success:
    - Calls `resetCreditsAfterPayment` from `useCreditsStore` to set `userFreeCredits`, `userPaidCredits`, and `userCreditsTotal` to 0.
    - Sets `hasPaid` to `true`.
    - Shows success toast: `Payment of ${queriesCostTotal} credits (${(queriesCostTotal * QUERY_COST).toFixed(5)} SOL) completed! Credits reset to 0.`.
  - On failure:
    - Shows error toast (e.g., “Insufficient SOL in wallet” or “Transaction expired”).
- **Store**: `resetCreditsAfterPayment` ensures credits are cleared after SOL payment, reflecting that queries were paid directly with SOL.

#### **7. Balance Display**
- **Where**:
  - `NavbarCredits`: Shows “Saved Credits” in the navbar.
  - `CreditSliderUI`: Displays credit and SOL balances.
  - `WalletToggle`: Shows `userCreditsTotal` as “Credits left”.
- **Action**:
  - `NavbarCredits` fetches balance from `/api/credits/balance` when `publicKey` exists.
  - `useCreditBalance` updates `creditBalance` for `CreditSliderUI`.
  - `WalletToggle` uses `userCreditsTotal` from `useCreditsStore` to show remaining credits (`userCreditsTotal - queriesRequested`).
- **Backend** (`app/api/credits/balance/route.ts`):
  - Queries `UserCredit` for `walletPublicKey`.
  - Returns `credits` or 0 if no record.
- **Store**: `useCreditsStore` provides `userCreditsTotal`, `userFreeCredits`, and `userPaidCredits` for UI components.

---

### **Flow Diagram**

```
User → /credits → Connect Wallet
  ↓
CreditSlider → Select Credits (1–100)
  ↓
Check Balances (useCreditBalance, SOL balance, useCreditsStore)
  ↓
Click "Pay Now" → useSolanaTransaction
  ↓
Create/Sign/Send Transaction → VERAFY_WALLET
  ↓
useCreditAssignment → /api/payment
  ↓
Backend Validates Transaction → Log to PaymentLog
  ↓
/api/credits/assign → Update UserCredit
  ↓
Update Frontend Balance (setCreditBalance, incrementPaidCredits) → Show Success Toast
  ↓
Query Payment (WalletToggle/PaymentControls) → Pay with SOL → resetCreditsAfterPayment
```

---

### **Additional Notes**

1. **Zustand Store**:
   - `useCreditsStore` centralizes credit management, ensuring consistent state across components.
   - `resetCreditsAfterPayment` is critical for the query payment flow, as it clears credits when SOL is used directly.
   - Potential integration point: `useCreditAssignment` could call `incrementPaidCredits` to sync with `useCreditsStore` after credit purchases.

2. **Constants**:
   - `QUERY_COST = 0.00001` SOL aligns with the updated system (previously 0.001 SOL in some files, suggesting a possible update).
   - `QUERY_COST_FIXED_DECIMALS = 5` ensures consistent SOL display (e.g., 0.00010 SOL for 10 credits).
   - `USER_FREE_CREDITS_DEFAULT = 10` provides initial credits, likely for onboarding users.

3. **Staking**:
   - `StakeSlider` remains disabled, indicating an incomplete feature.
   - No backend API or hook supports staking yet.

4. **Security**:
   - CSRF protection in API routes.
   - Zod validation for inputs.
   - Retry logic in `useSolanaTransaction` and `/api/payment`.
   - Sanitized error logging.

5. **Potential Issues**:
   - **Duplicate Hook**: `useSolanaWallet.tsx` is identical to `useSolanaTransaction.tsx`. Remove one to avoid confusion.
   - **QUERY_COST Mismatch**: Previous response assumed `QUERY_COST = 0.001` based on code comments; now clarified as 0.00001. Ensure all components use `lib/constants.ts`.
   - **Store Sync**: `useCreditBalance` (Prisma-based) and `useCreditsStore` (client-side) may desync if `incrementPaidCredits` isn’t called after `/api/credits/assign`.
   - **Hardcoded RPC**: `CreditSlider` uses `https://api.devnet.solana.com` directly instead of `CURRENT_SOLANA_NETWORK_RPC`.
   - **Atomicity**: No transaction rollback if `/api/credits/assign` fails after `/api/payment` succeeds.

6. **Improvements**:
   - Remove `useSolanaWallet.tsx`.
   - Sync `useCreditsStore` with `useCreditBalance` (e.g., call `incrementPaidCredits` in `useCreditAssignment`).
   - Use `CURRENT_SOLANA_NETWORK_RPC` consistently.
   - Implement staking functionality with a backend API.
   - Add database transactions for atomicity between payment and credit assignment.
   - Handle edge cases like transaction timeouts or partial failures.

---

### **Summary**
The Verafy Testnet payment system allows users to purchase credits (1 credit = 0.00001 SOL) using a Solana wallet, with a robust flow involving frontend sliders, hooks, a Zustand store, and backend APIs. Users connect a wallet, select credits, send a Solana transaction to `VERAFY_WALLET`, and receive credits after backend verification. Queries can be paid with SOL (resetting credits) or existing credits, tracked via `useCreditsStore`. The system includes strong security (CSRF, Zod, retries) but has minor issues like code duplication and an incomplete staking feature. The updated `QUERY_COST` and `useCreditsStore` enhance clarity and state management.

---


# Verafy Testnet Payment Flow

## Overview
The Verafy Testnet payment system enables users to purchase credits (1 credit = 0.00001 SOL) or pay for queries using Solana. It integrates frontend components, custom hooks, a Zustand store, and backend APIs.

## Flow Steps

### 1. User Initiates Credit Purchase
- **Where**: `/credits/` page (`CreditsLayout` → `CreditSlider`).
- **Action**: User connects Solana wallet and selects credits (1–100) via slider.
- **UI**: Shows credits, SOL cost (0.00001 SOL/credit), credit/SOL balances.
- **Store**: `useCreditsStore` tracks `userFreeCredits` (10), `userPaidCredits` (0), `userCreditsTotal`.

### 2. Wallet Connection and Balance Check
- **Hooks**: `useWallet`, `useCreditBalance` (fetches from `/api/credits/balance`), `CreditSlider` (SOL balance).
- **Validation**: Ensures `creditAmount` is 1–100, sufficient SOL.
- **Store**: `userCreditsTotal` used for display.

### 3. Transaction Creation
- **Hook**: `useSolanaTransaction`.
- **Action**: “Pay Now” triggers transaction to `VERAFY_WALLET`.
- **Process**: Creates `SystemProgram.transfer` (credits * 0.00001 SOL), signs, sends, confirms with retries.
- **Output**: `{ signature, signedTx }`.

### 4. Payment Verification
- **Hook**: `useCreditAssignment`.
- **Action**: Sends transaction to `/api/payment`.
- **Backend**: Validates transaction, recipient, amount, signatures; logs to `PaymentLog`.
- **Output**: Success response or error.

### 5. Credit Assignment
- **Hook**: `useCreditAssignment`.
- **Action**: Calls `/api/credits/assign`.
- **Backend**: Upserts `UserCredit`, logs to `PaymentLog`.
- **Frontend**: Updates `creditBalance`, shows success toast.
- **Store**: May update `userPaidCredits` (recommended).

### 6. Query Payment
- **Where**: `WalletToggle` → `PaymentControls`.
- **Action**: Pay with SOL for `queriesUnpaid`.
- **Process**: Sends SOL to `PAYMENT_RECIPIENT`, resets credits via `resetCreditsAfterPayment`.
- **Store**: Sets `userFreeCredits`, `userPaidCredits`, `userCreditsTotal` to 0.

### 7. Balance Display
- **Where**: `NavbarCredits`, `CreditSliderUI`, `WalletToggle`.
- **Action**: Fetches/displays balances from `/api/credits/balance` and `useCreditsStore`.

## Notes
- **Staking**: `StakeSlider` disabled.
- **Security**: CSRF, Zod, retries.
- **Issues**: Duplicate hook, potential store desync, hardcoded RPC.
- **Improvements**: Remove duplicate, sync store, implement staking, ensure atomicity.




-----------



With the addition of `store/credit-store.ts` and `lib/constants.ts`, the payment system on the Verafy Testnet can be further contextualized. Below is an updated flow of how the payment system works, incorporating the new files and refining the explanation to reflect their roles. The flow remains consistent with the previous response but is enhanced with details about the Zustand store for credit management and the constants that govern the system.

---

### **Overview**
The Verafy Testnet payment system enables users to:
1. Connect a Solana wallet and purchase credits (1 credit = `QUERY_COST` SOL, now defined as 0.00001 SOL).
2. Use credits or SOL to pay for queries, with free and paid credits tracked separately.
3. View and manage credit balances, with transactions processed securely on the Solana blockchain.
4. Stake SOL for credits (though this feature is disabled).

The system integrates frontend components (e.g., sliders, toggles), custom hooks (e.g., for Solana transactions and credit management), a Zustand store for credit state, and backend API routes for transaction processing and database updates. The `lib/constants.ts` file defines key parameters like `QUERY_COST` and default credit values, while `store/credit-store.ts` manages the state of free and paid credits.

---

### **Key Components and Their Roles**

#### **New Files**
1. **`store/credit-store.ts`**
   - A Zustand store for managing credit state (`CreditsStore`).
   - Tracks:
     - `userFreeCredits`: Free credits (default: 10, from `USER_FREE_CREDITS_DEFAULT`).
     - `userPaidCredits`: Paid credits (default: 0, from `USER_PAID_CREDITS_DEFAULT`).
     - `userCreditsTotal`: Sum of free and paid credits.
   - Provides actions:
     - `decrementFreeCredits`: Reduces free credits, ensuring non-negative values.
     - `decrementPaidCredits`: Reduces paid credits, ensuring non-negative values.
     - `incrementPaidCredits`: Increases paid credits (e.g., after purchase).
     - `resetCreditsAfterPayment`: Resets all credits to 0 after a SOL payment for queries.
   - Used by `components/ask/payment-controls.tsx` to reset credits and by other components to display or update credit balances.

2. **`lib/constants.ts`**
   - Defines configuration constants for the application.
   - Key constants for payments:
     - `QUERY_COST`: 0.00001 SOL per credit.
     - `QUERY_COST_FIXED_DECIMALS`: Dynamically calculated decimal places for `QUERY_COST` (5 for 0.00001).
     - `USER_FREE_CREDITS_DEFAULT`: 10 free credits for new users.
     - `USER_PAID_CREDITS_DEFAULT`: 0 paid credits initially.
     - `CURRENT_SOLANA_NETWORK_RPC`: Solana RPC URL (Devnet or Mainnet, based on `NEXT_PUBLIC_CURRENT_SOLANA_NETWORK_NAME`).
   - Other constants relate to queries (e.g., `ALLOWED_AMOUNT_QUERIES`) and voting, but are less relevant to payments.

#### **Previously Provided Components**
- **Frontend Components**:
  - `app/credits/page.tsx`: Renders the credits page with `CreditsLayout` and `SolanaProvider`.
  - `components/credits/credits-layout.tsx`: Displays `CreditSlider` and `StakeSlider`.
  - `components/credits/credit-slider.tsx`: Manages credit purchases using hooks.
  - `components/credits/credit-slider-ui.tsx`: UI for credit selection and payment.
  - `components/credits/stake-slider.tsx`: Disabled staking UI.
  - `components/ask/wallet-toggle.tsx`: Toggles between SOL and credit payments.
  - `components/ask/payment-controls.tsx`: Processes SOL payments for queries, resetting credits via `useCreditsStore`.
  - `components/ask/navbar-credits.tsx`: Displays credit balance in the navbar.

- **Custom Hooks**:
  - `hooks/useSolanaTransaction.tsx`: Creates and sends Solana transactions.
  - `hooks/useCreditAssignment.tsx`: Assigns credits post-transaction.
  - `hooks/useCreditBalance.tsx`: Fetches credit balance from `/api/credits/balance`.
  - `hooks/useSolanaWallet.tsx`: Duplicate of `useSolanaTransaction.tsx` (redundant).

- **Backend API Routes**:
  - `app/api/credits/assign/route.ts`: Assigns credits to a wallet.
  - `app/api/credits/balance/route.ts`: Retrieves credit balance.
  - `app/api/payment/route.ts`: Verifies and logs Solana transactions.

---

### **Updated Payment Flow**

#### **1. User Initiates Credit Purchase**
- **Where**: `/credits` page (`app/credits/page.tsx` → `CreditsLayout` → `CreditSlider`).
- **Action**: User connects a Solana wallet using `WalletMultiButton`.
- **UI**:
  - `CreditSlider` renders `CreditSliderUI`, showing a slider for selecting credits (0–100).
  - Displays:
    - Selected credits (`creditAmount`).
    - Cost in SOL (`creditAmount * QUERY_COST`, formatted to `QUERY_COST_FIXED_DECIMALS` = 5 decimals).
    - Credit balance (from `useCreditBalance`).
    - SOL balance (fetched via `connection.getBalance`).
  - Button shows “Connect Wallet” if not connected, “Pay Now” if valid, or is disabled if:
    - `creditAmount` is 0 or not 1–100.
    - Insufficient SOL (`solBalance < requiredSol`).
- **Store**: `useCreditsStore` provides `userCreditsTotal` for display in `WalletToggle` or other components.

#### **2. Wallet Connection and Balance Check**
- **Hook**: `useWallet` provides `publicKey`, `signTransaction`, and `connected` status.
- **Hook**: `useCreditBalance` fetches `creditBalance` from `/api/credits/balance` when `publicKey` changes.
  - Calls `/api/credits/balance` with `walletPublicKey`.
  - Sets `creditBalance` to 0 if no record exists or on error.
- **Hook**: `CreditSlider` fetches SOL balance using `connection.getBalance(publicKey)` (Devnet RPC).
- **Store**: `useCreditsStore` tracks `userFreeCredits` (default: 10) and `userPaidCredits` (default: 0).
  - `userCreditsTotal` is used to show available credits in `WalletToggle`.
- **Validation**:
  - `creditAmount` must be an integer between 1 and 100.
  - `solBalance >= requiredSol` (`creditAmount * 0.00001`).
  - If wallet is disconnected, `useWalletModal` prompts connection.

#### **3. Transaction Creation**
- **Hook**: `useSolanaTransaction` in `CreditSlider`.
- **Action**: User clicks “Pay Now,” triggering `handlePayment` in `CreditSlider`.
- **Process**:
  - Validates wallet connection, `creditAmount`, and SOL balance.
  - Calls `sendTransaction(creditAmount, VERAFY_WALLET)`:
    - Creates a `Transaction` with:
      - `ComputeBudgetProgram.setComputeUnitLimit` (700,000 units).
      - `ComputeBudgetProgram.setComputeUnitPrice` (500,000 microLamports).
      - `SystemProgram.transfer` to send `creditAmount * QUERY_COST * LAMPORTS_PER_SOL` (e.g., 10 credits = 0.0001 SOL = 100,000 lamports).
    - Sets `recentBlockhash` and `feePayer` (user’s `publicKey`).
    - Signs transaction using `signTransaction`.
    - Sends raw transaction to Solana Devnet (`CURRENT_SOLANA_NETWORK_RPC`) and confirms with “confirmed” commitment.
  - Retries up to 3 times on failure (e.g., network errors, blockhash expiration).
  - Returns `{ signature, signedTx }` on success.
- **Error Handling**:
  - Shows toasts for errors (e.g., `WalletSignTransactionError`, `SendTransactionError`).
  - Logs sanitized errors using `sanitizeError`.

#### **4. Payment Verification**
- **Hook**: `useCreditAssignment` in `CreditSlider`.
- **Action**: Calls `assignCredits(signature, signedTx, creditAmount, publicKey)` after successful transaction.
- **Process**:
  - Validates transaction’s SOL amount (`lamports === credits * QUERY_COST * 1_000_000_000`).
  - Sends POST to `/api/payment` with:
    - `transaction` (base64-encoded `signedTx`).
    - `signature`.
    - `credits`.
    - `userWallet` (public key).
  - **Backend** (`app/api/payment/route.ts`):
    - Verifies CSRF token (`verifyCsrfToken`).
    - Validates input with Zod (ensures valid public key, credits 1–100, etc.).
    - Checks user’s SOL balance (`connection.getBalance`).
    - Deserializes `transaction` and verifies:
      - Contains `SystemProgram.transfer` to `VERAFY_WALLET`.
      - Correct lamports (`credits * QUERY_COST * LAMPORTS_PER_SOL`).
      - Valid signatures and `recentBlockhash`.
    - Confirms transaction status with retries (up to 3 attempts) using `connection.getSignatureStatus`.
    - Logs to `PaymentLog` (Prisma):
      - Success: `status: "SUCCESS"`, `id: signature`.
      - Failure: `status: "FAILED"`, `error: message`, `id: UUID`.
    - Returns `{ status: "success", signature, credits, solAmount }` or error.
- **Store**: No direct interaction with `useCreditsStore` at this stage, as credit updates occur in the next step.

#### **5. Credit Assignment**
- **Hook**: `useCreditAssignment` continues.
- **Action**: Sends POST to `/api/credits/assign` with:
  - `walletPublicKey`.
  - `creditAmount`.
- **Backend** (`app/api/credits/assign/route.ts`):
  - Verifies CSRF token.
  - Validates input with Zod (`walletPublicKey` is a valid Solana public key, `creditAmount` is 1–100).
  - Upserts `UserCredit` record in Prisma:
    - Increments `credits` by `creditAmount` if record exists.
    - Creates new record with `credits: creditAmount` if none exists.
  - Logs to `PaymentLog`:
    - Success: `status: "ASSIGNED"`, `id: UUID`, `solAmount: creditAmount * QUERY_COST`.
    - Failure: `status: "FAILED"`, `error: message`.
  - Returns `{ success: true, credits: updatedCredit.credits }`.
- **Frontend**:
  - Updates `creditBalance` via `setCreditBalance` (from `useCreditBalance`).
  - Shows success toast: `${credits} credits added! New balance: ${assignData.credits}`.
- **Store**: `useCreditsStore` may be updated indirectly via `incrementPaidCredits` if integrated with `useCreditBalance` (not shown in provided code but implied).

#### **6. Query Payment Flow**
- **Where**: Query submission UI (e.g., via `WalletToggle` and `PaymentControls`).
- **Action**:
  - User toggles “Pay with Wallet” in `WalletToggle`.
  - If `queriesUnpaid > 0`, `PaymentControls` shows a “Pay” button.
- **Process** (`PaymentControls`):
  - Uses `useWallet` and `useConnection` to access `publicKey` and `sendTransaction`.
  - Creates a `SystemProgram.transfer` transaction:
    - Sends `queriesCostTotal * QUERY_COST * LAMPORTS_PER_SOL` to `PAYMENT_RECIPIENT`.
    - Sets `recentBlockhash` and `feePayer`.
  - Sends and confirms transaction on Solana Devnet.
  - On success:
    - Calls `resetCreditsAfterPayment` from `useCreditsStore` to set `userFreeCredits`, `userPaidCredits`, and `userCreditsTotal` to 0.
    - Sets `hasPaid` to `true`.
    - Shows success toast: `Payment of ${queriesCostTotal} credits (${(queriesCostTotal * QUERY_COST).toFixed(5)} SOL) completed! Credits reset to 0.`.
  - On failure:
    - Shows error toast (e.g., “Insufficient SOL in wallet” or “Transaction expired”).
- **Store**: `resetCreditsAfterPayment` ensures credits are cleared after SOL payment, reflecting that queries were paid directly with SOL.

#### **7. Balance Display**
- **Where**:
  - `NavbarCredits`: Shows “Saved Credits” in the navbar.
  - `CreditSliderUI`: Displays credit and SOL balances.
  - `WalletToggle`: Shows `userCreditsTotal` as “Credits left”.
- **Action**:
  - `NavbarCredits` fetches balance from `/api/credits/balance` when `publicKey` exists.
  - `useCreditBalance` updates `creditBalance` for `CreditSliderUI`.
  - `WalletToggle` uses `userCreditsTotal` from `useCreditsStore` to show remaining credits (`userCreditsTotal - queriesRequested`).
- **Backend** (`app/api/credits/balance/route.ts`):
  - Queries `UserCredit` for `walletPublicKey`.
  - Returns `credits` or 0 if no record.
- **Store**: `useCreditsStore` provides `userCreditsTotal`, `userFreeCredits`, and `userPaidCredits` for UI components.

---

### **Flow Diagram**

```
User → /credits → Connect Wallet
  ↓
CreditSlider → Select Credits (1–100)
  ↓
Check Balances (useCreditBalance, SOL balance, useCreditsStore)
  ↓
Click "Pay Now" → useSolanaTransaction
  ↓
Create/Sign/Send Transaction → VERAFY_WALLET
  ↓
useCreditAssignment → /api/payment
  ↓
Backend Validates Transaction → Log to PaymentLog
  ↓
/api/credits/assign → Update UserCredit
  ↓
Update Frontend Balance (setCreditBalance, incrementPaidCredits) → Show Success Toast
  ↓
Query Payment (WalletToggle/PaymentControls) → Pay with SOL → resetCreditsAfterPayment
```

---

### **Additional Notes**

1. **Zustand Store**:
   - `useCreditsStore` centralizes credit management, ensuring consistent state across components.
   - `resetCreditsAfterPayment` is critical for the query payment flow, as it clears credits when SOL is used directly.
   - Potential integration point: `useCreditAssignment` could call `incrementPaidCredits` to sync with `useCreditsStore` after credit purchases.

2. **Constants**:
   - `QUERY_COST = 0.00001` SOL aligns with the updated system (previously 0.001 SOL in some files, suggesting a possible update).
   - `QUERY_COST_FIXED_DECIMALS = 5` ensures consistent SOL display (e.g., 0.00010 SOL for 10 credits).
   - `USER_FREE_CREDITS_DEFAULT = 10` provides initial credits, likely for onboarding users.

3. **Staking**:
   - `StakeSlider` remains disabled, indicating an incomplete feature.
   - No backend API or hook supports staking yet.

4. **Security**:
   - CSRF protection in API routes.
   - Zod validation for inputs.
   - Retry logic in `useSolanaTransaction` and `/api/payment`.
   - Sanitized error logging.

5. **Potential Issues**:
   - **Duplicate Hook**: `useSolanaWallet.tsx` is identical to `useSolanaTransaction.tsx`. Remove one to avoid confusion.
   - **QUERY_COST Mismatch**: Previous response assumed `QUERY_COST = 0.001` based on code comments; now clarified as 0.00001. Ensure all components use `lib/constants.ts`.
   - **Store Sync**: `useCreditBalance` (Prisma-based) and `useCreditsStore` (client-side) may desync if `incrementPaidCredits` isn’t called after `/api/credits/assign`.
   - **Hardcoded RPC**: `CreditSlider` uses `https://api.devnet.solana.com` directly instead of `CURRENT_SOLANA_NETWORK_RPC`.
   - **Atomicity**: No transaction rollback if `/api/credits/assign` fails after `/api/payment` succeeds.

6. **Improvements**:
   - Remove `useSolanaWallet.tsx`.
   - Sync `useCreditsStore` with `useCreditBalance` (e.g., call `incrementPaidCredits` in `useCreditAssignment`).
   - Use `CURRENT_SOLANA_NETWORK_RPC` consistently.
   - Implement staking functionality with a backend API.
   - Add database transactions for atomicity between payment and credit assignment.
   - Handle edge cases like transaction timeouts or partial failures.

---

### **Summary**
The Verafy Testnet payment system allows users to purchase credits (1 credit = 0.00001 SOL) using a Solana wallet, with a robust flow involving frontend sliders, hooks, a Zustand store, and backend APIs. Users connect a wallet, select credits, send a Solana transaction to `VERAFY_WALLET`, and receive credits after backend verification. Queries can be paid with SOL (resetting credits) or existing credits, tracked via `useCreditsStore`. The system includes strong security (CSRF, Zod, retries) but has minor issues like code duplication and an incomplete staking feature. The updated `QUERY_COST` and `useCreditsStore` enhance clarity and state management.

---

