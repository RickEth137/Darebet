import { Keypair, Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

// Initialize connection to Solana
const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com',
  {
    commitment: 'confirmed',
    wsEndpoint: process.env.NEXT_PUBLIC_WSS_ENDPOINT
  }
);

// Initialize Treasury Wallet from Private Key
let treasuryKeypair: Keypair | null = null;

try {
  const privateKeyString = process.env.TREASURY_PRIVATE_KEY;
  if (privateKeyString) {
    // Decode Base58 private key
    const secretKey = bs58.decode(privateKeyString);
    treasuryKeypair = Keypair.fromSecretKey(secretKey);
  }
} catch (error) {
  console.error('Failed to initialize treasury wallet:', error);
}

export const getTreasuryBalance = async () => {
  if (!treasuryKeypair) return 0;
  return await connection.getBalance(treasuryKeypair.publicKey);
};

export const sendPayout = async (recipientAddress: string, amountSol: number) => {
  if (!treasuryKeypair) {
    throw new Error('Treasury wallet not initialized');
  }

  const recipient = new PublicKey(recipientAddress);
  const lamports = Math.round(amountSol * 1e9);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: treasuryKeypair.publicKey,
      toPubkey: recipient,
      lamports,
    })
  );

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [treasuryKeypair]
  );

  return signature;
};

export const getTreasuryPublicKey = () => {
  return treasuryKeypair?.publicKey.toString() || null;
};

export const verifyTransaction = async (signature: string, expectedAmountSol: number, expectedSender?: string) => {
  if (!treasuryKeypair) {
    throw new Error('Treasury wallet not initialized');
  }

  // 1. Fetch the transaction
  const tx = await connection.getParsedTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    throw new Error('Transaction not found on Solana blockchain');
  }

  // 2. Verify it was successful
  if (tx.meta?.err) {
    throw new Error('Transaction failed on-chain');
  }

  // 3. Find the transfer instruction to our treasury
  const treasuryPubkey = treasuryKeypair.publicKey.toString();
  const expectedLamports = Math.round(expectedAmountSol * 1e9);
  
  // Look for a transfer instruction
  // We need to handle both SystemProgram.transfer and potentially other transfer types if needed,
  // but for this simple app, we look for parsed instructions.
  const instructions = tx.transaction.message.instructions;
  
  let foundTransfer = false;
  let transferAmount = 0;

  for (const ix of instructions) {
    // Check if it's a parsed instruction (System Program)
    if ('parsed' in ix) {
      const parsed = ix.parsed;
      if (parsed.type === 'transfer') {
        const info = parsed.info;
        // Check if destination is treasury
        if (info.destination === treasuryPubkey) {
          // Check if source matches expected sender (if provided)
          if (expectedSender && info.source !== expectedSender) {
            continue; // Not the transfer we are looking for
          }
          
          transferAmount = info.lamports;
          foundTransfer = true;
          break;
        }
      }
    }
  }

  if (!foundTransfer) {
    throw new Error('No transfer to treasury found in this transaction');
  }

  // 4. Verify amount (allow for small floating point differences, though integers should be exact)
  // We use a small tolerance just in case, but usually exact match is best for crypto
  const tolerance = 5000; // 5000 lamports tolerance (tiny amount)
  if (Math.abs(transferAmount - expectedLamports) > tolerance) {
     throw new Error(`Transaction amount mismatch. Received: ${transferAmount / 1e9} SOL, Expected: ${expectedAmountSol} SOL`);
  }

  return {
    success: true,
    sender: tx.transaction.message.accountKeys[0].pubkey.toString(), // Usually the fee payer/signer is first
    amount: transferAmount / 1e9,
    slot: tx.slot,
    timestamp: tx.blockTime
  };
};
