import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { ResearchFundingProgram, ResearchProjectAccount } from '../../blockchain-backends/data-client/ResearchFunding';

interface ResearchFundingProps {
    program: Program;
}

const ResearchFunding: React.FC<ResearchFundingProps> = ({ program }) => {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();
    const [projects, setProjects] = useState<ResearchProjectAccount[]>([]);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [fundingAmount, setFundingAmount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [researchProgram, setResearchProgram] = useState<ResearchFundingProgram | null>(null);
    const [showNewProjectForm, setShowNewProjectForm] = useState(false);
    const [newProject, setNewProject] = useState({
        title: '',
        abstract: '',
        category: 'computerScience',
        fundingGoal: 10,
        minContribution: 0.1
    });

    // Initialize the Research Funding program
    useEffect(() => {
        if (publicKey && program && connection) {
            // Create provider
            const provider = new AnchorProvider(
                connection,
                {
                    publicKey,
                    signTransaction: signTransaction!,
                } as any,
                { commitment: 'confirmed' }
            );

            setResearchProgram(new ResearchFundingProgram(program, provider));
        }
    }, [publicKey, program, connection, signTransaction]);

    // Fetch research projects from the blockchain
    useEffect(() => {
        const fetchProjects = async () => {
            if (!researchProgram) return;

            setIsLoading(true);
            try {
                const projectAccounts = await researchProgram.getAllResearchProjects();
                setProjects(projectAccounts);
            } catch (error) {
                console.error("Error fetching research projects:", error);
                // Fallback to mock data for development/demo purposes
                setProjects([
                    {
                        publicKey: new PublicKey("111111111111111111111111111111111111"),
                        title: "Quantum Computing Research",
                        abstract: "Developing new algorithms for quantum computation...",
                        category: "computerScience",
                        fundingGoal: new BN(10 * 1_000_000_000), // 10 SOL
                        minContribution: new BN(0.1 * 1_000_000_000), // 0.1 SOL
                        currentFunding: new BN(2.5 * 1_000_000_000), // 2.5 SOL
                        creator: publicKey || new PublicKey("11111111111111111111111111111111"),
                        isActive: true,
                        createdAt: new BN(Date.now() / 1000 - 604800), // 1 week ago
                        isFullyFunded: false
                    },
                    {
                        publicKey: new PublicKey("222222222222222222222222222222222222"),
                        title: "CRISPR Gene Therapy",
                        abstract: "Novel applications of CRISPR technology in treating genetic disorders...",
                        category: "biology",
                        fundingGoal: new BN(25 * 1_000_000_000), // 25 SOL
                        minContribution: new BN(0.5 * 1_000_000_000), // 0.5 SOL
                        currentFunding: new BN(10 * 1_000_000_000), // 10 SOL
                        creator: publicKey || new PublicKey("11111111111111111111111111111111"),
                        isActive: true,
                        createdAt: new BN(Date.now() / 1000 - 1209600), // 2 weeks ago
                        isFullyFunded: false
                    },
                    {
                        publicKey: new PublicKey("333333333333333333333333333333333333"),
                        title: "Solar Panel Efficiency Research",
                        abstract: "Improving solar cell efficiency using new materials...",
                        category: "physics",
                        fundingGoal: new BN(15 * 1_000_000_000), // 15 SOL
                        minContribution: new BN(0.2 * 1_000_000_000), // 0.2 SOL
                        currentFunding: new BN(5 * 1_000_000_000), // 5 SOL
                        creator: publicKey || new PublicKey("11111111111111111111111111111111"),
                        isActive: true,
                        createdAt: new BN(Date.now() / 1000 - 432000), // 5 days ago
                        isFullyFunded: false
                    }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, [researchProgram, publicKey]);

    const handleFundProject = async () => {
        if (!publicKey || !researchProgram || !selectedProject || fundingAmount <= 0) return;
        setIsLoading(true);

        try {
            await researchProgram.fundProject(
                new PublicKey(selectedProject),
                fundingAmount
            );

            alert(`Successfully funded project with ${fundingAmount} SOL!`);

            // Update local state
            setProjects(prev =>
                prev.map(proj =>
                    proj.publicKey.toString() === selectedProject
                        ? {
                            ...proj,
                            currentFunding: proj.currentFunding.add(
                                new BN(fundingAmount * 1_000_000_000)
                            )
                        }
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

    const handleCreateProject = async () => {
        if (!publicKey || !researchProgram) return;
        setIsLoading(true);

        try {
            const projectPubkey = await researchProgram.createResearchProject({
                title: newProject.title,
                abstract: newProject.abstract,
                category: newProject.category,
                fundingGoal: newProject.fundingGoal,
                minContribution: newProject.minContribution
            });

            alert(`Successfully created research project!`);

            // Add the new project to the list
            const newProjectData: ResearchProjectAccount = {
                publicKey: projectPubkey,
                title: newProject.title,
                abstract: newProject.abstract,
                category: newProject.category,
                fundingGoal: new BN(newProject.fundingGoal * 1_000_000_000),
                minContribution: new BN(newProject.minContribution * 1_000_000_000),
                currentFunding: new BN(0),
                creator: publicKey,
                isActive: true,
                createdAt: new BN(Date.now() / 1000),
                isFullyFunded: false
            };

            setProjects([...projects, newProjectData]);

            // Reset form
            setNewProject({
                title: '',
                abstract: '',
                category: 'computerScience',
                fundingGoal: 10,
                minContribution: 0.1
            });
            setShowNewProjectForm(false);
        } catch (error) {
            console.error('Error creating research project:', error);
            alert(`Failed to create project: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateProgress = (current: BN, goal: BN) => {
        return Math.min((current.toNumber() / goal.toNumber()) * 100, 100);
    };

    const formatSOL = (lamports: BN) => {
        return (lamports.toNumber() / 1_000_000_000).toFixed(2);
    };

    return (
        <div className="research-funding-component">
            <h2>Fund Scientific Research</h2>
            <p className="subtitle">Support groundbreaking research using Solana blockchain</p>

            <div className="funding-actions">
                <button
                    className="create-project-button"
                    onClick={() => setShowNewProjectForm(!showNewProjectForm)}
                >
                    {showNewProjectForm ? 'Cancel' : 'Create New Research Project'}
                </button>
            </div>

            {showNewProjectForm && (
                <div className="new-project-form">
                    <h3>Create New Research Project</h3>
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={newProject.title}
                            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                            placeholder="Research project title"
                        />
                    </div>

                    <div className="form-group">
                        <label>Abstract</label>
                        <textarea
                            value={newProject.abstract}
                            onChange={(e) => setNewProject({ ...newProject, abstract: e.target.value })}
                            placeholder="Brief description of your research"
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select
                            value={newProject.category}
                            onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                        >
                            <option value="computerScience">Computer Science</option>
                            <option value="biology">Biology</option>
                            <option value="physics">Physics</option>
                            <option value="chemistry">Chemistry</option>
                            <option value="mathematics">Mathematics</option>
                            <option value="medicine">Medicine</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Funding Goal (SOL)</label>
                        <input
                            type="number"
                            min="1"
                            value={newProject.fundingGoal}
                            onChange={(e) => setNewProject({ ...newProject, fundingGoal: parseFloat(e.target.value) })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Minimum Contribution (SOL)</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={newProject.minContribution}
                            onChange={(e) => setNewProject({ ...newProject, minContribution: parseFloat(e.target.value) })}
                        />
                    </div>

                    <button
                        onClick={handleCreateProject}
                        disabled={isLoading || !newProject.title || !newProject.abstract}
                        className="create-button"
                    >
                        {isLoading ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
            )}

            <div className="projects-grid">
                {projects.map(project => (
                    <div
                        key={project.publicKey.toString()}
                        className={`project-card ${selectedProject === project.publicKey.toString() ? 'selected' : ''}`}
                        onClick={() => setSelectedProject(project.publicKey.toString())}
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
                                <span>{formatSOL(project.currentFunding)} SOL raised</span>
                                <span>Goal: {formatSOL(project.fundingGoal)} SOL</span>
                            </div>
                        </div>
                        {project.creator.equals(publicKey || new PublicKey("11111111111111111111111111111111")) &&
                            <div className="creator-badge">Your Project</div>
                        }
                    </div>
                ))}

                {projects.length === 0 && !isLoading && (
                    <div className="no-projects">
                        <p>No research projects found. Create the first one!</p>
                    </div>
                )}

                {isLoading && projects.length === 0 && (
                    <div className="loading">Loading projects...</div>
                )}
            </div>

            {selectedProject && (
                <div className="funding-form">
                    <h3>Support This Research</h3>
                    <div className="form-group">
                        <label>Amount (SOL)</label>
                        <input
                            type="number"
                            min={projects.find(p => p.publicKey.toString() === selectedProject)?.minContribution.toNumber() / 1_000_000_000 || 0.1}
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

            <div className="funding-info">
                <h3>About Research Funding</h3>
                <p>
                    Supporting scientific research has never been more transparent and accessible.
                    When you fund a project on our platform:
                </p>
                <ul>
                    <li>Your contribution is securely recorded on the Solana blockchain</li>
                    <li>Researchers receive funding only when their funding goal is met</li>
                    <li>You'll gain access to research updates and publications</li>
                    <li>Your support is recognized with special contributor NFTs</li>
                </ul>
            </div>
        </div>
    );
};

export default ResearchFunding;
