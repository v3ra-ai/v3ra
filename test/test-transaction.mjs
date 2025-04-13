
// node --experimental-specifier-resolution=node test-transaction.mjs
import {
  Keypair,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SendTransactionError,
} from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const VERAFY_WALLET = "GFY1U36t5HjVv8Gtq33bCdepUnPURtX46mPQXdAPaM4d";
const LAMPORTS_TO_AIRDROP = 1_000_000_000; // 1 SOL
const LAMPORTS_TO_TRANSFER = 10_000_000; // 0.01 SOL

async function requestAirdropWithRetry(publicKey, lamports, maxAttempts = 3, delayMs = 5000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const signature = await connection.requestAirdrop(publicKey, lamports);
      await connection.confirmTransaction({ signature }, "confirmed");
      console.log(`Airdrop successful: ${lamports / 1_000_000_000} SOL to ${publicKey.toBase58()}`);
      return;
    } catch (error) {
      console.error(`Airdrop attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
      if (attempt < maxAttempts) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new Error("Failed to airdrop SOL after retries");
}

(async () => {
  try {
    // Generate new keypair
    const from = Keypair.generate();
    console.log("New keypair generated:");
    console.log("Public key:", from.publicKey.toBase58());
    console.log("Secret key:", Array.from(from.secretKey));

    // Airdrop SOL
    console.log("Requesting airdrop...");
    await requestAirdropWithRetry(from.publicKey, LAMPORTS_TO_AIRDROP);

    // Verify balance
    const balance = await connection.getBalance(from.publicKey);
    console.log("Sender balance:", balance / 1_000_000_000, "SOL");
    if (balance < LAMPORTS_TO_TRANSFER + 5000) {
      throw new Error("Insufficient SOL after airdrop");
    }

    // Create transaction
    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: new PublicKey(VERAFY_WALLET),
        lamports: LAMPORTS_TO_TRANSFER,
      }),
    );

    // Set recent blockhash and fee payer
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = from.publicKey;

    // Sign transaction
    tx.sign(from);

    // Send transaction
    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    console.log("Signature (base58):", signature);
    console.log("Transaction (base64):", tx.serialize().toString("base64"));

    // Confirm transaction
    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed",
    );
    console.log("Transaction confirmed");

    // Output for curl
    console.log("\nRun this curl command:");
    console.log(
      `curl -X POST http://localhost:3000/api/payment \\`,
      `-H "Content-Type: application/json" \\`,
      `-d '{"transaction":"${tx.serialize().toString("base64")}","signature":"${signature}","credits":10,"userWallet":"${from.publicKey.toBase58()}"}'`,
    );
  } catch (error) {
    if (error instanceof SendTransactionError) {
      console.error("SendTransactionError:", {
        message: error.message,
        logs: await error.getLogs(connection),
      });
    } else {
      console.error("Error:", error instanceof Error ? error.message : String(error));
    }
    process.exit(1);
  }
})();