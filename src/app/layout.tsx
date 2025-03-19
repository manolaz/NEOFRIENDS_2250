import { Inter } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ['latin'] });

// Dynamically import the wallet provider to avoid SSR issues
const SolanaWalletProviderDynamic = dynamic(
    () => import('@/components/SolanaWalletProvider').then(mod => mod.SolanaWalletProvider),
    { ssr: false }
);

export const metadata: Metadata = {
    title: 'NEOFRIENDS 2250',
    description: 'Open-World Web Browser RPG with Solana Integration',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <SolanaWalletProviderDynamic>
                    {children}
                </SolanaWalletProviderDynamic>
            </body>
        </html>
    );
}