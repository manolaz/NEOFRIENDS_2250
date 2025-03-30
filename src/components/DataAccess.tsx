import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { ScienceNFT } from '../../planet_pioneers-blockchain-backends/clients/solana/ScienceNFT';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

interface DataAccessProps {
    program: Program;
}

interface DataSet {
    id: string;
    title: string;
    description: string;
    owner: string;
    accessType: 'open' | 'token-gated' | 'paid';
    price?: number;
}

const DataAccess: React.FC<DataAccessProps> = ({ program }) => {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();
    const [datasets, setDatasets] = useState<DataSet[]>([]);
    const [ownedDatasets, setOwnedDatasets] = useState<string[]>([]);
    const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [accessUrl, setAccessUrl] = useState<string | null>(null);

    // Mock data fetching - in real app would call the contract
    useEffect(() => {
        if (publicKey && program) {
            // Fetch available datasets
            setDatasets([
                {
                    id: 'data1',
                    title: 'Genome Sequencing Data',
                    description: 'Complete genome sequences of 1000 different plant species...',
                    owner: 'Research Lab A',
                    accessType: 'token-gated'
                },
                {
                    id: 'data2',
                    title: 'Climate Data 2010-2020',
                    description: 'Global temperature and precipitation data collected from 1000 stations...',
                    owner: 'Climate Research Institute',
                    accessType: 'paid',
                    price: 5
                },
                {
                    id: 'data3',
                    title: 'Particle Physics Experiment Results',
                    description: 'Raw data from particle collider experiments...',
                    owner: 'Physics Research Center',
                    accessType: 'open'
                }
            ]);

            // Mock owned datasets
            setOwnedDatasets(['data3']);
        }
    }, [publicKey, program]);

    const handleRequestAccess = async () => {
        if (!publicKey || !program || !selectedDataset) return;
        setIsLoading(true);

        try {
            const dataset = datasets.find(d => d.id === selectedDataset);
            if (!dataset) throw new Error('Dataset not found');

            if (dataset.accessType === 'open' || ownedDatasets.includes(selectedDataset)) {
                // Already have access
                setAccessUrl(`https://science-data.example.com/access/${selectedDataset}?key=demo123`);
            } else if (dataset.accessType === 'token-gated') {
                // Need to verify NFT ownership and grant access
                const provider = new AnchorProvider(
                    connection,
                    {
                        publicKey,
                        signTransaction: signTransaction!,
                    } as any,
                    { commitment: 'confirmed' }
                );

                const scienceNFT = new ScienceNFT(program, provider);
                await scienceNFT.grantDataAccess(
                    new PublicKey(selectedDataset),
                    publicKey
                );

                // In a real app, this would trigger access being granted
                setOwnedDatasets(prev => [...prev, selectedDataset]);
                setAccessUrl(`https://science-data.example.com/access/${selectedDataset}?key=generated123`);
            } else if (dataset.accessType === 'paid' && dataset.price) {
                // Would implement payment logic here
                alert(`Payment of ${dataset.price} SOL required for access`);
            }
        } catch (error) {
            console.error('Error requesting access:', error);
            alert(`Failed to request access: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="data-access-component">
            <h2>Research Data Access</h2>

            <div className="datasets-list">
                <h3>Available Datasets</h3>
                {datasets.map(dataset => (
                    <div
                        key={dataset.id}
                        className={`dataset-card ${selectedDataset === dataset.id ? 'selected' : ''} ${dataset.accessType}`}
                        onClick={() => setSelectedDataset(dataset.id)}
                    >
                        <h4>{dataset.title}</h4>
                        <p>{dataset.description}</p>
                        <div className="dataset-meta">
                            <span>Owner: {dataset.owner}</span>
                            <span className={`access-badge ${dataset.accessType}`}>
                                {dataset.accessType === 'open' && 'Open Access'}
                                {dataset.accessType === 'token-gated' && 'NFT Required'}
                                {dataset.accessType === 'paid' && `Paid (${dataset.price} SOL)`}
                            </span>
                        </div>
                        {ownedDatasets.includes(dataset.id) && (
                            <div className="owned-badge">Access Granted</div>
                        )}
                    </div>
                ))}
            </div>

            {selectedDataset && (
                <div className="access-request">
                    <button
                        onClick={handleRequestAccess}
                        disabled={isLoading}
                        className="access-button"
                    >
                        {isLoading ? 'Processing...' : 'Request Data Access'}
                    </button>
                </div>
            )}

            {accessUrl && (
                <div className="access-granted">
                    <h3>Access Granted!</h3>
                    <p>You can now access this dataset using the following URL:</p>
                    <div className="access-url">{accessUrl}</div>
                    <button className="download-button">Download Dataset</button>
                </div>
            )}
        </div>
    );
};

export default DataAccess;
