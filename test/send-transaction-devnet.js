import { Connection } from "@solana/web3.js";
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
(async () => {
  try {
    const signature = await connection.sendRawTransaction(
      Buffer.from(
        "AVHmktozWz+XOUVtZ3yZvNQHw3j4vW6zneUwHD7V9peny6V5RV1dPMVVIPg8PX0oUmYhAqROVEMDN/UeXDYy0wgBAAEDmPj+nUTXhZyZjZ8F38bqxuAcGK+WaIXhjz/ySG/9z+HimH8B0QmHe6YSyK7u5+VX69sVaaN/QqgTLUuKgEL/ygAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZe+mMlDC44DLZdOsanouYZ2BGNY1L3Ul257K38vtipMBAgIAAQwCAAAAgJaYAAAAAAA=",
        "base64",
      ),
      { skipPreflight: false, preflightCommitment: "confirmed" },
    );
    console.log("Signature:", signature);
  } catch (error) {
    console.error("Send error:", error);
  }
})();
