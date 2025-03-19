"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the wallet provider to avoid SSR issues
const SolanaWalletProviderDynamic = dynamic(
    () => import('./SolanaWalletProvider').then(mod => mod.SolanaWalletProvider),
    { ssr: false }
);

export function ClientWalletProvider({ children }: { children: React.ReactNode }) {
    return <SolanaWalletProviderDynamic>{children}</SolanaWalletProviderDynamic>;
}