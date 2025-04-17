import { Transaction } from "@solana/web3.js";
const myBase64Signature =
  "AVHmktozWz+XOUVtZ3yZvNQHw3j4vW6zneUwHD7V9peny6V5RV1dPMVVIPg8PX0oUmYhAqROVEMDN/UeXDYy0wgBAAEDmPj+nUTXhZyZjZ8F38bqxuAcGK+WaIXhjz/ySG/9z+HimH8B0QmHe6YSyK7u5+VX69sVaaN/QqgTLUuKgEL/ygAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZe+mMlDC44DLZdOsanouYZ2BGNY1L3Ul257K38vtipMBAgIAAQwCAAAAgJaYAAAAAAA=";

const tx = Transaction.from(Buffer.from(myBase64Signature, "base64"));

function isValidBase64Binary(str) {
  try {
    const buf = Buffer.from(str, "base64");
    // Check if re-encoding the buffer matches the original (ignoring padding)
    return buf.toString("base64").replace(/=+$/, "") === str.replace(/=+$/, "");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
}

console.log(isValidBase64Binary(myBase64Signature)); // true or false

console.log({
  signature: tx.signatures[0]?.signature?.toString("base64"),
  fromPubkey: tx.instructions[0].keys[0].pubkey.toBase58(),
  toPubkey: tx.instructions[0].keys[1].pubkey.toBase58(),
});
