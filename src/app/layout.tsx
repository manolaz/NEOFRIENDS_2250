import { Inter } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import { ClientWalletProvider } from '@/components/ClientWalletProvider';

const inter = Inter({ subsets: ['latin'] });

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
                <ClientWalletProvider>
                    {children}
                </ClientWalletProvider>
            </body>
        </html>
    );
}