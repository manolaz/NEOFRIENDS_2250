import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { ScienceNFT } from '../../blockchain-backends/data-client/ScienceNFT';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

interface PeerReviewProps {
    program: Program;
}

interface ResearchSubmission {
    id: string;
    title: string;
    abstract: string;
    currentStatus: string;
}

const PeerReview: React.FC<PeerReviewProps> = ({ program }) => {
    const { publicKey, signTransaction } = useWallet();
    const { connection } = useConnection();
    const [availableSubmissions, setAvailableSubmissions] = useState<ResearchSubmission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
    const [reviewComments, setReviewComments] = useState('');
    const [reviewStatus, setReviewStatus] = useState('pending');
    const [isLoading, setIsLoading] = useState(false);

    // Mock data fetching - in real app would call the contract
    useEffect(() => {
        if (publicKey && program) {
            // Fetch available submissions
            setAvailableSubmissions([
                {
                    id: 'submission1',
                    title: 'Novel Approach to Quantum Computing',
                    abstract: 'This research presents a groundbreaking approach to quantum computing...',
                    currentStatus: 'pending'
                },
                {
                    id: 'submission2',
                    title: 'Climate Change Effects on Marine Ecosystems',
                    abstract: 'A comprehensive analysis of how climate change impacts...',
                    currentStatus: 'pending'
                }
            ]);
        }
    }, [publicKey, program]);

    const handleSubmitReview = async () => {
        if (!publicKey || !program || !selectedSubmission) return;
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
            await scienceNFT.updatePeerReviewStatus(
                new PublicKey(selectedSubmission),
                reviewStatus,
                publicKey
            );

            // In a real app, we would also store the review comments
            alert('Review submitted successfully!');

            // Update local state
            setAvailableSubmissions(prev =>
                prev.map(sub =>
                    sub.id === selectedSubmission
                        ? { ...sub, currentStatus: reviewStatus }
                        : sub
                )
            );

            // Reset form
            setSelectedSubmission(null);
            setReviewComments('');
            setReviewStatus('pending');
        } catch (error) {
            console.error('Error submitting review:', error);
            alert(`Failed to submit review: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="peer-review-component">
            <h2>Peer Review Portal</h2>

            <div className="submissions-list">
                <h3>Available Submissions for Review</h3>
                {availableSubmissions.length > 0 ? (
                    <ul>
                        {availableSubmissions.map(submission => (
                            <li
                                key={submission.id}
                                className={selectedSubmission === submission.id ? 'selected' : ''}
                                onClick={() => setSelectedSubmission(submission.id)}
                            >
                                <h4>{submission.title}</h4>
                                <p>{submission.abstract.substring(0, 100)}...</p>
                                <span className={`status ${submission.currentStatus}`}>
                                    Status: {submission.currentStatus}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No submissions available for review.</p>
                )}
            </div>

            {selectedSubmission && (
                <div className="review-form">
                    <h3>Submit Your Review</h3>
                    <div className="form-group">
                        <label>Review Comments</label>
                        <textarea
                            value={reviewComments}
                            onChange={(e) => setReviewComments(e.target.value)}
                            placeholder="Enter your detailed review"
                            rows={6}
                        />
                    </div>
                    <div className="form-group">
                        <label>Review Status</label>
                        <select
                            value={reviewStatus}
                            onChange={(e) => setReviewStatus(e.target.value)}
                        >
                            <option value="approved">Approve</option>
                            <option value="revisions_required">Revisions Required</option>
                            <option value="rejected">Reject</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSubmitReview}
                        disabled={isLoading || !reviewComments}
                        className="submit-review-button"
                    >
                        {isLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PeerReview;
