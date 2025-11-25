import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export function verifyWalletSignature(
  walletAddress: string,
  message: string,
  signature: string
): boolean {
  try {
    const publicKey = new PublicKey(walletAddress);
    const signatureUint8 = bs58.decode(signature);
    const messageUint8 = new TextEncoder().encode(message);

    return nacl.sign.detached.verify(
      messageUint8,
      signatureUint8,
      publicKey.toBytes()
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}
