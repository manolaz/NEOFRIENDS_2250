'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import of the Game component with no SSR
const GameCanvas = dynamic(() => import('@/components/GameCanvas'), {
    ssr: false,
    loading: () => <div className="w-full h-screen flex items-center justify-center">Loading NEOFRIENDS 2250...</div>
});

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between">
            <GameCanvas />
        </main>
    );
}