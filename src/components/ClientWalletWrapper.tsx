"use client";

import { ClientWalletProvider } from './ClientWalletProvider';
import { ReactNode, useState, useEffect } from 'react';

export function ClientWalletWrapper({ children }: { children: ReactNode }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Only render the wallet provider on the client side to prevent hydration mismatches
    if (!isMounted) {
        return <>{children}</>;
    }

    return <ClientWalletProvider>{children}</ClientWalletProvider>;
}