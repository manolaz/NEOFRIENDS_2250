import { Program, web3, BN, AnchorProvider } from "@project-serum/anchor";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

export interface ResearchProjectData {
  title: string;
  abstract: string;
  category: string;
  fundingGoal: number; // in SOL
  minContribution: number; // in SOL
}

export interface ResearchProjectAccount {
  publicKey: PublicKey;
  title: string;
  abstract: string;
  category: string;
  fundingGoal: BN;
  minContribution: BN;
  currentFunding: BN;
  creator: PublicKey;
  isActive: boolean;
  createdAt: BN;
  isFullyFunded: boolean;
}

export interface ContributionRecord {
  project: PublicKey;
  funder: PublicKey;
  amount: BN;
  timestamp: BN;
}

export class ResearchFundingProgram {
  program: Program;
  provider: AnchorProvider;
  programId: PublicKey;

  constructor(program: Program, provider: AnchorProvider) {
    this.program = program;
    this.provider = provider;
    this.programId = new PublicKey(
      "DeSciRsrchFndProg1111111111111111111111111"
    );
  }

  async createResearchProject(
    projectData: ResearchProjectData
  ): Promise<PublicKey> {
    const projectAccount = web3.Keypair.generate();

    try {
      await this.program.methods
        .initializeResearchProject(
          projectData.title,
          projectData.abstract,
          projectData.category,
          new BN(projectData.fundingGoal * web3.LAMPORTS_PER_SOL), // Convert SOL to lamports
          new BN(projectData.minContribution * web3.LAMPORTS_PER_SOL) // Convert SOL to lamports
        )
        .accounts({
          project: projectAccount.publicKey,
          creator: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([projectAccount])
        .rpc();

      return projectAccount.publicKey;
    } catch (error) {
      console.error("Error creating research project:", error);
      throw error;
    }
  }

  async fundProject(
    projectPubKey: PublicKey,
    amountInSol: number
  ): Promise<string> {
    const amount = new BN(amountInSol * web3.LAMPORTS_PER_SOL);
    const [contributionPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("contribution"),
        projectPubKey.toBuffer(),
        this.provider.wallet.publicKey.toBuffer(),
      ],
      this.programId
    );

    try {
      const txId = await this.program.methods
        .fundProject(amount)
        .accounts({
          project: projectPubKey,
          contribution: contributionPda,
          funder: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return txId;
    } catch (error) {
      console.error("Error funding project:", error);
      throw error;
    }
  }

  async withdrawProjectFunds(projectPubKey: PublicKey): Promise<string> {
    try {
      const txId = await this.program.methods
        .withdrawProjectFunds()
        .accounts({
          project: projectPubKey,
          creator: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return txId;
    } catch (error) {
      console.error("Error withdrawing project funds:", error);
      throw error;
    }
  }

  async closeProject(projectPubKey: PublicKey): Promise<string> {
    try {
      const txId = await this.program.methods
        .closeProject()
        .accounts({
          project: projectPubKey,
          creator: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return txId;
    } catch (error) {
      console.error("Error closing project:", error);
      throw error;
    }
  }

  async getResearchProject(
    projectPubKey: PublicKey
  ): Promise<ResearchProjectAccount | null> {
    try {
      const account = await this.program.account.researchProject.fetch(
        projectPubKey
      );

      return {
        publicKey: projectPubKey,
        title: account.title,
        abstract: account.abstract_text,
        category: account.category,
        fundingGoal: account.fundingGoal,
        minContribution: account.minContribution,
        currentFunding: account.currentFunding,
        creator: account.creator,
        isActive: account.isActive,
        createdAt: account.createdAt,
        isFullyFunded: account.isFullyFunded,
      };
    } catch (error) {
      console.error("Error fetching research project:", error);
      return null;
    }
  }

  async getAllResearchProjects(): Promise<ResearchProjectAccount[]> {
    try {
      const accounts = await this.program.account.researchProject.all();
      return accounts.map((acc) => ({
        publicKey: acc.publicKey,
        title: acc.account.title,
        abstract: acc.account.abstract_text,
        category: acc.account.category,
        fundingGoal: acc.account.fundingGoal,
        minContribution: acc.account.minContribution,
        currentFunding: acc.account.currentFunding,
        creator: acc.account.creator,
        isActive: acc.account.isActive,
        createdAt: acc.account.createdAt,
        isFullyFunded: acc.account.isFullyFunded,
      }));
    } catch (error) {
      console.error("Error fetching all research projects:", error);
      return [];
    }
  }

  async getContributions(
    projectPubKey: PublicKey
  ): Promise<ContributionRecord[]> {
    try {
      const accounts = await this.program.account.projectContribution.all([
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: projectPubKey.toBase58(),
          },
        },
      ]);

      return accounts.map((acc) => ({
        project: acc.account.project,
        funder: acc.account.funder,
        amount: acc.account.amount,
        timestamp: acc.account.timestamp,
      }));
    } catch (error) {
      console.error("Error fetching contributions:", error);
      return [];
    }
  }

  async getUserContributions(
    userPubKey: PublicKey
  ): Promise<ContributionRecord[]> {
    try {
      const accounts = await this.program.account.projectContribution.all([
        {
          memcmp: {
            offset: 8 + 32, // After discriminator + project pubkey
            bytes: userPubKey.toBase58(),
          },
        },
      ]);

      return accounts.map((acc) => ({
        project: acc.account.project,
        funder: acc.account.funder,
        amount: acc.account.amount,
        timestamp: acc.account.timestamp,
      }));
    } catch (error) {
      console.error("Error fetching user contributions:", error);
      return [];
    }
  }
}
