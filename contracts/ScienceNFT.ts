import { Program, web3, BN, AnchorProvider } from "@project-serum/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";

export interface ScienceMetadata {
  title: string;
  authors: string[];
  abstract: string;
  dataHash: string;
  category: string;
  peerReviewStatus: string;
  publicationDate: number;
  citations: string[];
  fundingSource: string;
}

export class ScienceNFT {
  program: Program;
  provider: AnchorProvider;

  constructor(program: Program, provider: AnchorProvider) {
    this.program = program;
    this.provider = provider;
  }

  async mintResearchNFT(
    metadata: ScienceMetadata,
    mintAuthority: PublicKey,
    recipient: PublicKey
  ): Promise<string> {
    const metadataAccount = web3.Keypair.generate();

    try {
      await this.program.methods
        .mintResearchNFT(metadata)
        .accounts({
          metadata: metadataAccount.publicKey,
          mintAuthority,
          recipient,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([metadataAccount])
        .rpc();

      return metadataAccount.publicKey.toString();
    } catch (error) {
      console.error("Error minting research NFT:", error);
      throw error;
    }
  }

  async updatePeerReviewStatus(
    metadataAccount: PublicKey,
    newStatus: string,
    reviewer: PublicKey
  ): Promise<void> {
    try {
      await this.program.methods
        .updatePeerReviewStatus(newStatus)
        .accounts({
          metadata: metadataAccount,
          reviewer,
        })
        .rpc();
    } catch (error) {
      console.error("Error updating peer review status:", error);
      throw error;
    }
  }

  async grantDataAccess(
    metadataAccount: PublicKey,
    accessor: PublicKey
  ): Promise<void> {
    try {
      await this.program.methods
        .grantDataAccess()
        .accounts({
          metadata: metadataAccount,
          accessor,
          authority: this.provider.wallet.publicKey,
        })
        .rpc();
    } catch (error) {
      console.error("Error granting data access:", error);
      throw error;
    }
  }

  async fundResearch(researchAccount: PublicKey, amount: BN): Promise<void> {
    try {
      await this.program.methods
        .fundResearch(amount)
        .accounts({
          research: researchAccount,
          funder: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
    } catch (error) {
      console.error("Error funding research:", error);
      throw error;
    }
  }
}
