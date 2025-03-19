"use client";

import { ClientWalletProvider } from './ClientWalletProvider';
import { ReactNode } from 'react';

export function ClientWalletWrapper({ children }: { children: ReactNode }) {
    return <ClientWalletProvider>{children}</ClientWalletProvider>;
}