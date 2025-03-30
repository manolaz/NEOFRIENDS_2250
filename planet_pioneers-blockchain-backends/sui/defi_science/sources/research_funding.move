module research_funding::research_funding {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::sui::SUI;
    use std::string::{String};
    
    // Error codes
    const EProjectInactive: u64 = 1;
    const EContributionTooSmall: u64 = 2;
    const EUnauthorized: u64 = 3;
    const EProjectNotFullyFunded: u64 = 4;
    const EProjectFullyFunded: u64 = 5;
    
    // Structs (similar to accounts in Solana)
    struct ResearchProject has key, store {
        id: UID,
        title: String,
        abstract_text: String,
        category: String,
        funding_goal: u64,
        min_contribution: u64,
        current_funding: u64,
        creator: address,
        is_active: bool,
        created_at: u64,
        is_fully_funded: bool
    }
    
    struct ProjectContribution has key, store {
        id: UID,
        project_id: ID,
        funder: address,
        amount: u64,
        timestamp: u64
    }
    
    // Events
    struct FundingEvent has copy, drop {
        project_id: ID,
        funder: address,
        amount: u64,
        timestamp: u64
    }
    
    struct WithdrawEvent has copy, drop {
        project_id: ID,
        recipient: address,
        amount: u64,
        timestamp: u64
    }
    
    struct ProjectClosedEvent has copy, drop {
        project_id: ID,
        creator: address,
        timestamp: u64
    }
    
    // Entry functions (similar to instructions in Solana)
    
    public entry fun initialize_research_project(
        title: String,
        abstract_text: String,
        category: String,
        funding_goal: u64,
        min_contribution: u64,
        ctx: &mut TxContext
    ) {
        let project = ResearchProject {
            id: object::new(ctx),
            title,
            abstract_text,
            category,
            funding_goal,
            min_contribution,
            current_funding: 0,
            creator: tx_context::sender(ctx),
            is_active: true,
            created_at: tx_context::epoch(ctx),
            is_fully_funded: false
        };
        
        // Make project a shared object so anyone can fund it
        transfer::share_object(project);
    }
    
    public entry fun fund_project(
        project: &mut ResearchProject,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Check if project is active
        assert!(project.is_active, EProjectInactive);
        
        let amount = coin::value(&payment);
        
        // Check if contribution meets minimum
        assert!(amount >= project.min_contribution, EContributionTooSmall);
        
        // Add funds to project
        // In a full implementation, you'd want to store these funds in a separate object
        // or transfer them to a specific address
        coin::destroy_for_gas(payment);
        
        // Update project funding
        project.current_funding = project.current_funding + amount;
        
        // Check if funding goal reached
        if (project.current_funding >= project.funding_goal) {
            project.is_fully_funded = true;
        };
        
        // Create contribution record
        let contribution = ProjectContribution {
            id: object::new(ctx),
            project_id: object::id(project),
            funder: tx_context::sender(ctx),
            amount,
            timestamp: tx_context::epoch(ctx)
        };
        
        // Transfer contribution record to funder
        transfer::transfer(contribution, tx_context::sender(ctx));
        
        // Emit event
        event::emit(FundingEvent {
            project_id: object::id(project),
            funder: tx_context::sender(ctx),
            amount,
            timestamp: tx_context::epoch(ctx)
        });
    }
    
    public entry fun withdraw_project_funds(
        project: &mut ResearchProject,
        ctx: &mut TxContext
    ) {
        // Only creator can withdraw funds
        assert!(project.creator == tx_context::sender(ctx), EUnauthorized);
        
        // Project must be fully funded
        assert!(project.is_fully_funded, EProjectNotFullyFunded);
        
        // In a real implementation, you would transfer the coin object
        // that holds the project funds
        // For this example, we just emit an event
        
        event::emit(WithdrawEvent {
            project_id: object::id(project),
            recipient: project.creator,
            amount: project.current_funding,
            timestamp: tx_context::epoch(ctx)
        });
    }
    
    public entry fun close_project(
        project: &mut ResearchProject,
        ctx: &mut TxContext
    ) {
        // Only creator can close project
        assert!(project.creator == tx_context::sender(ctx), EUnauthorized);
        
        // Cannot close fully funded projects
        assert!(!project.is_fully_funded, EProjectFullyFunded);
        
        project.is_active = false;
        
        event::emit(ProjectClosedEvent {
            project_id: object::id(project),
            creator: project.creator,
            timestamp: tx_context::epoch(ctx)
        });
    }
}