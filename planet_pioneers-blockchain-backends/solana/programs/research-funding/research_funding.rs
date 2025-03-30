use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use solana_program::program::invoke;
use solana_program::system_instruction;

declare_id!("DeSciRsrchFndProg1111111111111111111111111");

#[program]
pub mod research_funding {
    use super::*;

    pub fn initialize_research_project(
        ctx: Context<InitializeProject>,
        title: String,
        abstract_text: String,
        category: String,
        funding_goal: u64,
        min_contribution: u64,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let creator = &ctx.accounts.creator;

        project.title = title;
        project.abstract_text = abstract_text;
        project.category = category;
        project.funding_goal = funding_goal;
        project.min_contribution = min_contribution;
        project.current_funding = 0;
        project.creator = *creator.key;
        project.is_active = true;
        project.created_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn fund_project(
        ctx: Context<FundProject>,
        amount: u64,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let funder = &ctx.accounts.funder;
        
        // Check if project is still active
        require!(project.is_active, ErrorCode::ProjectInactive);
        
        // Check if contribution meets minimum amount
        require!(amount >= project.min_contribution, ErrorCode::ContributionTooSmall);

        // Transfer SOL from funder to project account
        invoke(
            &system_instruction::transfer(
                funder.key,
                &project.key(),
                amount,
            ),
            &[
                funder.to_account_info(),
                project.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Update project funding amount
        project.current_funding = project.current_funding.checked_add(amount)
            .ok_or(ErrorCode::FundingOverflow)?;
            
        // Check if funding goal is reached
        if project.current_funding >= project.funding_goal {
            project.is_fully_funded = true;
        }

        // Record the contribution
        let contribution = &mut ctx.accounts.contribution;
        contribution.project = project.key();
        contribution.funder = *funder.key;
        contribution.amount = amount;
        contribution.timestamp = Clock::get()?.unix_timestamp;

        emit!(FundingEvent {
            project: project.key(),
            funder: *funder.key,
            amount: amount,
            timestamp: contribution.timestamp,
        });

        Ok(())
    }

    pub fn withdraw_project_funds(
        ctx: Context<WithdrawFunds>,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let creator = &ctx.accounts.creator;
        
        // Only creator can withdraw funds
        require!(project.creator == *creator.key, ErrorCode::Unauthorized);
        
        // Project must be fully funded to withdraw
        require!(project.is_fully_funded, ErrorCode::ProjectNotFullyFunded);

        let project_balance = **project.to_account_info().lamports.borrow();
        
        **project.to_account_info().try_borrow_mut_lamports()? -= project_balance;
        **creator.to_account_info().try_borrow_mut_lamports()? += project_balance;

        emit!(WithdrawEvent {
            project: project.key(),
            recipient: *creator.key,
            amount: project_balance,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn close_project(
        ctx: Context<CloseProject>,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let creator = &ctx.accounts.creator;
        
        // Only creator can close project
        require!(project.creator == *creator.key, ErrorCode::Unauthorized);
        
        // Cannot close fully funded projects
        require!(!project.is_fully_funded, ErrorCode::ProjectFullyFunded);
        
        project.is_active = false;

        // Return remaining funds to contributors (simplified version)
        // A complete implementation would iterate through all contributions
        // and return proportional amounts to each contributor

        emit!(ProjectClosedEvent {
            project: project.key(),
            creator: *creator.key,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String, abstract_text: String, category: String)]
pub struct InitializeProject<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 4 + title.len() + 4 + abstract_text.len() + 4 + category.len() + 8 + 8 + 8 + 32 + 1 + 8 + 1
    )]
    pub project: Account<'info, ResearchProject>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundProject<'info> {
    #[account(mut)]
    pub project: Account<'info, ResearchProject>,
    
    #[account(
        init,
        payer = funder,
        space = 8 + 32 + 32 + 8 + 8,
        seeds = [b"contribution", project.key().as_ref(), funder.key().as_ref()],
        bump
    )]
    pub contribution: Account<'info, ProjectContribution>,
    
    #[account(mut)]
    pub funder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut, has_one = creator)]
    pub project: Account<'info, ResearchProject>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseProject<'info> {
    #[account(mut, has_one = creator)]
    pub project: Account<'info, ResearchProject>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct ResearchProject {
    pub title: String,
    pub abstract_text: String,
    pub category: String,
    pub funding_goal: u64,
    pub min_contribution: u64,
    pub current_funding: u64,
    pub creator: Pubkey,
    pub is_active: bool,
    pub created_at: i64,
    pub is_fully_funded: bool,
}

#[account]
pub struct ProjectContribution {
    pub project: Pubkey,
    pub funder: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct FundingEvent {
    pub project: Pubkey,
    pub funder: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    pub project: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ProjectClosedEvent {
    pub project: Pubkey,
    pub creator: Pubkey,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Project is not active")]
    ProjectInactive,
    #[msg("Contribution amount is below minimum")]
    ContributionTooSmall,
    #[msg("Arithmetic overflow during funding calculation")]
    FundingOverflow,
    #[msg("Unauthorized operation")]
    Unauthorized,
    #[msg("Project is not fully funded yet")]
    ProjectNotFullyFunded,
    #[msg("Cannot close fully funded project")]
    ProjectFullyFunded,
}