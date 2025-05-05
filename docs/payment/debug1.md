I am getting this error when using the credit slider
Please help resolve.
Do not assume code, if you need more files tell me.
Please refer to previous chats for current files.
Only make changes that are needed to code, do not alter code not needing to be changed.
Pursue a simple solution first before more complex solutions.
Consider additional logging to pinpoint the exact point of failure.
Research AccountNotFound... the accounts show on devnet and have confirmed on the Blockchain explorer for devnet, including signatures here.


I am on http://localhost:3000/credits
The slider says 10
Cost: 0.00010 SOL
Current Balance: 158 credits
SOL Balance: 12.56780 SOL

Fetched credit balance 158
{
    "QUERY_COST": 0.00001,
    "QUERY_COST_FIXED_DECIMALS": 5,
    "creditAmount": 10,
    "requiredSol": 0.0001,
    "solBalance": 12.567801107,
    "hasEnoughSol": true,
    "isValid": true,
    "isLoading": false,
    "isWalletConnected": true
}

Fetch SOL balance 12.567801107
{
    "QUERY_COST": 0.00001,
    "QUERY_COST_FIXED_DECIMALS": 5,
    "creditAmount": 10,
    "requiredSol": 0.0001,
    "solBalance": 12.567801107,
    "hasEnoughSol": true,
    "isValid": true,
    "isLoading": false,
    "isWalletConnected": true
}

Wallet is connected.
9sLgc1jMhhvSQ7TWcD4HLbnqvLm4sir7yktjA9WfkQPE


CreditSliderUI cost display
{
    "requiredSol": 0.0001,
    "decimalPlaces": 5,
    "formattedCost": "0.00010"
}

CURRENT_SOLANA_NETWORK_NAME Devnet

Click on Pay Now button

Wallet popup

Confirm Transaction
The transaction was reverted
AccountNotFound
No balance changes detected. Proceed with caution and confirm only if you trust this site.
Requested by
localhost:3000
Verafy v0 Testnet

APPROVE

Modal popup
Transaction failed: Simulation failed. Message: Transaction simulation failed: Attempt to debit an account but found no record of a prior credit.. Logs: []. Catch the `SendTransactionError` and call `getLogs()` on it for full details.

Button stuck on Processing

Initiating transaction for 10 credits to E2RNZVf9s6daGFNSz19fxLVivBngnaT2AAzyZNfTSgxh
{
    "creditAmount": 10,
    "recipient": "E2RNZVf9s6daGFNSz19fxLVivBngnaT2AAzyZNfTSgxh",
    "requiredSol": 0.0001,
    "walletPublicKey": "9sLgc1jMhhvSQ7TWcD4HLbnqvLm4sir7yktjA9WfkQPE"
}

Wallet state before transaction:

{
    "publicKey": "9sLgc1jMhhvSQ7TWcD4HLbnqvLm4sir7yktjA9WfkQPE",
    "signTransactionAvailable": true,
    "isWalletConnected": true
}

VERAFY_WALLET initialization:

{
    "address": "E2RNZVf9s6daGFNSz19fxLVivBngnaT2AAzyZNfTSgxh",
    "balanceInSol": 2.001
}

Transaction before signing (attempt 1 ):
{
    "instructions": [
        {
            "index": 0,
            "programId": "ComputeBudget111111111111111111111111111111",
            "keys": [],
            "data": "0260ae0a00"
        },
        {
            "index": 1,
            "programId": "ComputeBudget111111111111111111111111111111",
            "keys": [],
            "data": "0320a1070000000000"
        },
        {
            "index": 2,
            "programId": "11111111111111111111111111111111",
            "keys": [
                "9sLgc1jMhhvSQ7TWcD4HLbnqvLm4sir7yktjA9WfkQPE",
                "E2RNZVf9s6daGFNSz19fxLVivBngnaT2AAzyZNfTSgxh"
            ],
            "data": "02000000a086010000000000"
        }
    ],
    "lamports": 100000,
    "recentBlockhash": "F3B12papJjiEC5U41P8KHueZqG9y95YjZptNsEd4xBbR",
    "feePayer": "9sLgc1jMhhvSQ7TWcD4HLbnqvLm4sir7yktjA9WfkQPE"
}


useSolanaTransaction.tsx:132 Transaction failed: Simulation failed.
Message: Transaction simulation failed: Attempt to debit an account but found no record of a prior credit..
Logs:
[].
Catch the `SendTransactionError` and call `getLogs()` on it for full details.
error @ intercept-console-error.js:50
useSolanaTransaction.useCallback[sendTransaction] @ useSolanaTransaction.tsx:132Understand this error
useSolanaTransaction.tsx:142 Attempt 1 failed, retrying in 1000ms...
{
    "signatures": [
        {
            "0": 126,
            "1": 54,
            "2": 25,
            "3": 89,
            "4": 87,
            "5": 16,
            "6": 84,
            "7": 238,
            "8": 207,
            "9": 216,
            "10": 49,
            "11": 188,
            "12": 199,
            "13": 41,
            "14": 243,
            "15": 55,
            "16": 42,
            "17": 202,
            "18": 225,
            "19": 203,
            "20": 24,
            "21": 254,
            "22": 54,
            "23": 230,
            "24": 19,
            "25": 122,
            "26": 0,
            "27": 167,
            "28": 141,
            "29": 239,
            "30": 174,
            "31": 57,
            "32": 165,
            "33": 8,
            "34": 54,
            "35": 212,
            "36": 76,
            "37": 211,
            "38": 135,
            "39": 48,
            "40": 175,
            "41": 30,
            "42": 205,
            "43": 61,
            "44": 133,
            "45": 3,
            "46": 77,
            "47": 123,
            "48": 191,
            "49": 111,
            "50": 123,
            "51": 252,
            "52": 81,
            "53": 44,
            "54": 130,
            "55": 152,
            "56": 143,
            "57": 154,
            "58": 155,
            "59": 76,
            "60": 39,
            "61": 12,
            "62": 99,
            "63": 1
        }
    ],
    "message": {
        "header": {
            "numRequiredSignatures": 1,
            "numReadonlySignedAccounts": 0,
            "numReadonlyUnsignedAccounts": 2
        },
        "accountKeys": [
            "9sLgc1jMhhvSQ7TWcD4HLbnqvLm4sir7yktjA9WfkQPE",
            "E2RNZVf9s6daGFNSz19fxLVivBngnaT2AAzyZNfTSgxh",
            "11111111111111111111111111111111",
            "ComputeBudget111111111111111111111111111111"
        ],
        "recentBlockhash": "F3B12papJjiEC5U41P8KHueZqG9y95YjZptNsEd4xBbR",
        "instructions": [
            {
                "programIdIndex": 3,
                "accounts": [],
                "data": "GZPvto"
            },
            {
                "programIdIndex": 3,
                "accounts": [],
                "data": "3Jv73z5Y9SRV"
            },
            {
                "programIdIndex": 2,
                "accounts": [
                    0,
                    1
                ],
                "data": "3Bxs4ThwQbE4vyj5"
            }
        ],
        "indexToProgramIds": {}
    }
}




--------------------------------------------

Fixed

Update on fix


* CSRF Token Inclusion: The fetch call to /api/credits/assign now includes the X-CSRF-Token header with a token fetched from /api/csrf-token, satisfying verifyCsrfToken’s requirement for tokenFromHeader.
* Cookie Handling: Setting credentials: "include" ensures the csrf-token cookie (set by /api/csrf-token) is sent with the request, satisfying tokenFromCookie.
* Token Matching: Since /api/csrf-token generates the token and sets it in both the response ({ csrfToken }) and cookie, the header and cookie tokens will match, passing verifyCsrfToken’s check (tokenFromHeader === tokenFromCookie).
* Logging: The added logs confirm the token is fetched, sent, and received, helping diagnose any future issues.
* Minimal Changes: Only useCreditAssignment.ts is modified, preserving useSolanaTransaction.tsx (fixed for AccountNotFound and TypeScript), CreditSlider.tsx, CreditSliderUI.tsx, and the CSRF files.