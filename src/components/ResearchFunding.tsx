import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { ScienceNFT } from '../../contracts/ScienceNFT';
import { Program, AnchorProvider, BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

interface ResearchFundingProps {
    program: Program;
}

interface ResearchProject {
    id: string;
    title: string;
    abstract: string;
    fundingGoal: number;
    currentFunding: number;
    category: string;
}

const ResearchFunding: React.FC<ResearchFundingProps> = ({ program }) => {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();
    const [projects, setProjects] = useState<ResearchProject[]>([]);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [fundingAmount, setFundingAmount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);

    // Mock data fetching - in real app would call the contract
    useEffect(() => {
        if (publicKey && program) {
            // Fetch available research projects
            setProjects([
                {
                    id: 'project1',
                    title: 'Quantum Computing Research',
                    abstract: 'Developing new algorithms for quantum computation...',
                    fundingGoal: 10000,
                    currentFunding: 2500,
                    category: 'computerScience'
                },
                {
                    id: 'project2',
                    title: 'CRISPR Gene Therapy',
                    abstract: 'Novel applications of CRISPR technology in treating genetic disorders...',
                    fundingGoal: 25000,
                    currentFunding: 10000,
                    category: 'biology'
                },
                {
                    id: 'project3',
                    title: 'Solar Panel Efficiency Research',
                    abstract: 'Improving solar cell efficiency using new materials...',
                    fundingGoal: 15000,
                    currentFunding: 5000,
                    category: 'physics'
                }
            ]);
        }
    }, [publicKey, program]);

    const handleFundProject = async () => {
        if (!publicKey || !program || !selectedProject || fundingAmount <= 0) return;
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
            await scienceNFT.fundResearch(
                new PublicKey(selectedProject),
                new BN(fundingAmount * 1_000_000_000) // Convert to lamports
            );

            alert(`Successfully funded project with ${fundingAmount} SOL!`);

            // Update local state
            setProjects(prev =>
                prev.map(proj =>
                    proj.id === selectedProject
                        ? { ...proj, currentFunding: proj.currentFunding + fundingAmount }
                        : proj
                )
            );

            // Reset form
            setSelectedProject(null);
            setFundingAmount(0);
        } catch (error) {
            console.error('Error funding project:', error);
            alert(`Failed to fund project: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateProgress = (current: number, goal: number) => {
        return Math.min((current / goal) * 100, 100);
    };

    return (
        <div className="research-funding-component">
            <h2>Fund Scientific Research</h2>

            <div className="projects-grid">
                {projects.map(project => (
                    <div
                        key={project.id}
                        className={`project-card ${selectedProject === project.id ? 'selected' : ''}`}
                        onClick={() => setSelectedProject(project.id)}
                    >
                        <h3>{project.title}</h3>
                        <p className="abstract">{project.abstract}</p>
                        <div className="category-tag">{project.category}</div>
                        <div className="funding-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${calculateProgress(project.currentFunding, project.fundingGoal)}%` }}
                                />
                            </div>
                            <div className="funding-stats">
                                <span>${project.currentFunding} raised</span>
                                <span>Goal: ${project.fundingGoal}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedProject && (
                <div className="funding-form">
                    <h3>Support This Research</h3>
                    <div className="form-group">
                        <label>Amount (SOL)</label>
                        <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={fundingAmount}
                            onChange={(e) => setFundingAmount(parseFloat(e.target.value))}
                            placeholder="Enter funding amount"
                        />
                    </div>

                    <button
                        onClick={handleFundProject}
                        disabled={isLoading || fundingAmount <= 0}
                        className="fund-button"
                    >
                        {isLoading ? 'Processing...' : 'Fund This Project'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResearchFunding;
