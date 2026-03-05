'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';
import { useRouter } from 'next/navigation';

function randomBlockhash(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bs58.encode(bytes);
}

export default function LoginPage() {
  const { publicKey, signTransaction, connected, disconnect } = useWallet();
  const [status, setStatus] = useState<'idle' | 'signing' | 'verifying' | 'error'>('idle');
  const [error, setError] = useState('');
  const router = useRouter();

  const authenticate = useCallback(async () => {
    if (!publicKey || !signTransaction) return;
    setStatus('signing');
    setError('');

    try {
      const challengeRes = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      });
      const { nonce } = await challengeRes.json();
      if (!nonce) throw new Error('Failed to get challenge');

      const tx = new Transaction({
        feePayer: publicKey,
        recentBlockhash: randomBlockhash(),
      });
      tx.add(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: publicKey, lamports: 0 }));

      const signedTx = await signTransaction(tx);
      const txSig = signedTx.signatures[0];
      if (!txSig || !txSig.signature) throw new Error('No signature returned');

      setStatus('verifying');
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          signature: bs58.encode(txSig.signature),
          nonce,
          message: bs58.encode(signedTx.serializeMessage()),
          type: 'transaction',
        }),
      });

      const result = await verifyRes.json();
      if (result.success) {
        router.push('/admin');
      } else {
        setError(result.error || 'Authentication failed');
        setStatus('error');
        disconnect();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setStatus('error');
      disconnect();
    }
  }, [publicKey, signTransaction, router, disconnect]);

  useEffect(() => {
    if (connected && publicKey && signTransaction && status === 'idle') {
      authenticate();
    }
  }, [connected, publicKey, signTransaction, status, authenticate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="glass-card p-8 max-w-sm w-full text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Admin Access</h1>
        <p className="text-text-muted text-sm">Connect your Solana wallet (Devnet) to authenticate</p>
        <div className="flex justify-center"><WalletMultiButton /></div>
        {status === 'signing' && <p className="text-accent text-sm animate-pulse">Approve the transaction in your wallet...</p>}
        {status === 'verifying' && <p className="text-accent text-sm animate-pulse">Verifying signature...</p>}
        {error && (
          <div>
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button onClick={() => { setStatus('idle'); setError(''); }} className="text-accent text-sm hover:underline">Try again</button>
          </div>
        )}
        <p className="text-text-dim text-xs">Phantom (Devnet) required. No SOL spent.</p>
      </div>
    </div>
  );
}
