//
// This was used to get a correct base-64 output for testing transactions in payment route

import {
  Keypair,
  Transaction,
  SystemProgram,
  Connection,
  PublicKey,
} from "@solana/web3.js";
const connection = new Connection(CURRENT_SOLANA_NETWORK_RPC, "confirmed");
(async () => {
  const from = Keypair.generate();
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: new PublicKey("GFY1U36t5HjVv8Gtq33bCdepUnPURtX46mPQXdAPaM4d"),
      lamports: 10000000, // 0.01 SOL
    }),
  );
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = from.publicKey;
  tx.sign(from);
  console.log(tx.serialize().toString("base64"));
})();
