import React, { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@project-serum/anchor';
import ScienceNFTMinter from '../components/ScienceNFTMinter';
import PeerReview from '../components/PeerReview';
import ResearchFunding from '../components/ResearchFunding';
import DataAccess from '../components/DataAccess';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '../styles/deScience.css';

const DeSciencePage: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const [activeTab, setActiveTab] = useState('publish');
    const [program, setProgram] = useState<Program | null>(null);

    useEffect(() => {
        if (publicKey && connection) {
            // This would normally load the actual Solana program
            // For demo purposes we're just setting a placeholder
            setProgram({} as Program);
        }
    }, [publicKey, connection]);

    return (
        <div className="descience-page">
            <header className="descience-header">
                <h1>Decentralized Science Platform</h1>
                <p>Revolutionizing scientific research with Solana NFTs</p>
                <div className="wallet-container">
                    <WalletMultiButton />
                </div>
            </header>

            {!publicKey ? (
                <div className="connect-prompt">
                    <h2>Connect your wallet to get started</h2>
                    <p>Use the "Connect Wallet" button above to access the platform</p>
                </div>
            ) : (
                <>
                    <nav className="descience-nav">
                        <ul>
                            <li className={activeTab === 'publish' ? 'active' : ''}>
                                <button onClick={() => setActiveTab('publish')}>Publish Research</button>
                            </li>
                            <li className={activeTab === 'review' ? 'active' : ''}>
                                <button onClick={() => setActiveTab('review')}>Peer Review</button>
                            </li>
                            <li className={activeTab === 'fund' ? 'active' : ''}>
                                <button onClick={() => setActiveTab('fund')}>Fund Research</button>
                            </li>
                            <li className={activeTab === 'access' ? 'active' : ''}>
                                <button onClick={() => setActiveTab('access')}>Access Data</button>
                            </li>
                        </ul>
                    </nav>

                    <div className="tab-content">
                        {activeTab === 'publish' && program && (
                            <ScienceNFTMinter program={program} />
                        )}

                        {activeTab === 'review' && program && (
                            <PeerReview program={program} />
                        )}

                        {activeTab === 'fund' && program && (
                            <ResearchFunding program={program} />
                        )}

                        {activeTab === 'access' && program && (
                            <DataAccess program={program} />
                        )}
                    </div>
                </>
            )}

            <footer className="descience-footer">
                <p>Decentralized Science Platform powered by Solana NFTs</p>
                <div className="footer-links">
                    <a href="#">About</a>
                    <a href="#">Terms</a>
                    <a href="#">Privacy</a>
                    <a href="#">Contact</a>
                </div>
            </footer>
        </div>
    );
};

export default DeSciencePage;
