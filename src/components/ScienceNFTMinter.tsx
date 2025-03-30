import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { ScienceNFT, ScienceMetadata } from '../../blockchain-backends/data-client/ScienceNFT';
import { Program, AnchorProvider } from '@project-serum/anchor';

interface ScienceNFTMinterProps {
    program: Program;
}

const ScienceNFTMinter: React.FC<ScienceNFTMinterProps> = ({ program }) => {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();
    const [metadata, setMetadata] = useState<ScienceMetadata>({
        title: '',
        authors: [],
        abstract: '',
        dataHash: '',
        category: '',
        peerReviewStatus: 'pending',
        publicationDate: Date.now(),
        citations: [],
        fundingSource: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [mintedNFTId, setMintedNFTId] = useState<string | null>(null);

    const handleInputChange = (field: keyof ScienceMetadata, value: any) => {
        setMetadata(prev => ({
            ...prev,
            [field]: field === 'authors' || field === 'citations' ? value.split(',') : value
        }));
    };

    const handleMintNFT = async () => {
        if (!publicKey || !program) return;
        setIsLoading(true);

        try {
            // Create provider
            const provider = new AnchorProvider(
                connection,
                {
                    publicKey,
                    signTransaction: signTransaction!,
                } as any,
                { commitment: 'confirmed' }
            );

            const scienceNFT = new ScienceNFT(program, provider);
            const nftId = await scienceNFT.mintResearchNFT(
                metadata,
                publicKey,
                publicKey
            );

            setMintedNFTId(nftId);
            alert(`Successfully minted research NFT with ID: ${nftId}`);
        } catch (error) {
            console.error('Error minting research NFT:', error);
            alert(`Failed to mint NFT: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="science-nft-minter">
            <h2>Mint Your Research as an NFT</h2>
            <div className="form-group">
                <label>Research Title</label>
                <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter research title"
                />
            </div>
            <div className="form-group">
                <label>Authors (comma separated)</label>
                <input
                    type="text"
                    value={metadata.authors.join(',')}
                    onChange={(e) => handleInputChange('authors', e.target.value)}
                    placeholder="Author 1, Author 2, ..."
                />
            </div>
            <div className="form-group">
                <label>Abstract</label>
                <textarea
                    value={metadata.abstract}
                    onChange={(e) => handleInputChange('abstract', e.target.value)}
                    placeholder="Research abstract"
                    rows={4}
                />
            </div>
            <div className="form-group">
                <label>Data Hash (SHA-256)</label>
                <input
                    type="text"
                    value={metadata.dataHash}
                    onChange={(e) => handleInputChange('dataHash', e.target.value)}
                    placeholder="Hash of your research data"
                />
            </div>
            <div className="form-group">
                <label>Category</label>
                <select
                    value={metadata.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                >
                    <option value="">Select category</option>
                    <option value="biology">Biology</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="physics">Physics</option>
                    <option value="astronomy">Astronomy</option>
                    <option value="medicine">Medicine</option>
                    <option value="computerScience">Computer Science</option>
                </select>
            </div>
            <div className="form-group">
                <label>Funding Source</label>
                <input
                    type="text"
                    value={metadata.fundingSource}
                    onChange={(e) => handleInputChange('fundingSource', e.target.value)}
                    placeholder="Funding organization or grant number"
                />
            </div>

            <button
                onClick={handleMintNFT}
                disabled={isLoading || !publicKey}
                className="mint-button"
            >
                {isLoading ? 'Minting...' : 'Mint Research NFT'}
            </button>

            {mintedNFTId && (
                <div className="success-message">
                    <h3>Successfully Minted!</h3>
                    <p>NFT ID: {mintedNFTId}</p>
                </div>
            )}
        </div>
    );
};

export default ScienceNFTMinter;
