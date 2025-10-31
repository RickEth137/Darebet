use anchor_lang::prelude::*;
use anchor_lang::system_program;
use std::str::FromStr;

declare_id!("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

#[program]
pub mod dare_betting {
    use super::*;

    pub fn create_dare(
        ctx: Context<CreateDare>,
        title: String,
        description: String,
        deadline: i64,
        min_bet: u64,
    ) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        dare.creator = ctx.accounts.creator.key();
        // For now, set creator as platform authority. In production, this should be a dedicated admin key
        dare.platform_authority = ctx.accounts.creator.key();
        dare.title = title;
        dare.description = description;
        dare.deadline = deadline;
        dare.min_bet = min_bet;
        dare.total_pool = 0;
        dare.will_do_pool = 0;
        dare.wont_do_pool = 0;
        dare.is_completed = false;
        dare.is_expired = false;
        dare.creator_fee_claimed = false;
        dare.submission_count = 0;
        dare.winners_selected = false;
        dare.first_place_winner = None;
        dare.second_place_winner = None;
        dare.third_place_winner = None;
        dare.first_place_claimed = false;
        dare.second_place_claimed = false;
        dare.third_place_claimed = false;
        dare.bump = ctx.bumps.dare;
        
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        bet_type: BetType,
    ) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        let bet = &mut ctx.accounts.bet;
        
        require!(amount >= dare.min_bet, ErrorCode::BetTooLow);
        require!(Clock::get()?.unix_timestamp < dare.deadline, ErrorCode::DareExpired);
        require!(!dare.is_completed, ErrorCode::DareAlreadyCompleted);

        // Transfer SOL from bettor to pool account
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.bettor.to_account_info(),
                to: ctx.accounts.pool_account.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        // Update dare pools
        dare.total_pool += amount;
        match bet_type {
            BetType::WillDo => dare.will_do_pool += amount,
            BetType::WontDo => dare.wont_do_pool += amount,
        }

        // Record bet
        bet.dare = dare.key();
        bet.bettor = ctx.accounts.bettor.key();
        bet.amount = amount;
        bet.bet_type = bet_type;
        bet.bet_timestamp = Clock::get()?.unix_timestamp; // Store when bet was placed
        bet.is_claimed = false;
        bet.bump = ctx.bumps.bet;

        Ok(())
    }

    pub fn submit_proof(
        ctx: Context<SubmitProof>,
        proof_hash: String,
        proof_description: String,
    ) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        let proof_submission = &mut ctx.accounts.proof_submission;
        
        require!(Clock::get()?.unix_timestamp < dare.deadline, ErrorCode::DareExpired);
        require!(!dare.is_completed, ErrorCode::DareAlreadyCompleted);
        require!(!dare.is_expired, ErrorCode::DareExpired);

        // Initialize the proof submission account
        proof_submission.dare = dare.key();
        proof_submission.submitter = ctx.accounts.submitter.key();
        proof_submission.proof_hash = proof_hash;
        proof_submission.proof_description = proof_description;
        proof_submission.submission_timestamp = Clock::get()?.unix_timestamp;
        proof_submission.is_approved = false; // Requires admin approval
        proof_submission.approved_by = Pubkey::default();
        proof_submission.approval_timestamp = 0;
        proof_submission.likes_count = 0;
        proof_submission.is_winner = false;
        proof_submission.winner_rank = 0;
        proof_submission.reward_claimed = false;
        proof_submission.bump = ctx.bumps.proof_submission;

        // Increment submission count
        dare.submission_count = dare.submission_count.checked_add(1).unwrap();

        Ok(())
    }

    pub fn select_winners(
        ctx: Context<SelectWinners>,
        first_place: Pubkey,
        second_place: Pubkey,
        third_place: Pubkey,
    ) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        
        // Only platform authority can select winners
        require!(
            ctx.accounts.platform_authority.key() == dare.platform_authority,
            ErrorCode::Unauthorized
        );

        // Can only select winners after deadline
        require!(
            Clock::get()?.unix_timestamp >= dare.deadline,
            ErrorCode::DareNotFinalized
        );

        // Can't select winners twice
        require!(!dare.winners_selected, ErrorCode::WinnersAlreadySelected);

        // Update winners
        dare.first_place_winner = Some(first_place);
        dare.second_place_winner = Some(second_place);
        dare.third_place_winner = Some(third_place);
        dare.winners_selected = true;
        dare.is_completed = true;

        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        let bet = &mut ctx.accounts.bet;
        
        require!(!bet.is_claimed, ErrorCode::AlreadyClaimed);
        
        let mut payout = 0u64;
        let creator_fee = dare.total_pool * 2 / 100; // 2% creator fee
        let available_pool = dare.total_pool - creator_fee;

        // Check if dare is completed with selected winners
        if dare.is_completed && dare.winners_selected {
            // For completed dares with selected winners, "Will do" bettors win
            if bet.bet_type == BetType::WillDo && dare.will_do_pool > 0 {
                // Calculate remaining pool after winner rewards (30% + 15% + 5% = 50%)
                let winner_rewards_total = available_pool * 50 / 100;
                let remaining_pool = available_pool - winner_rewards_total;
                payout = (bet.amount * remaining_pool) / dare.will_do_pool;
            }
        } else if Clock::get()?.unix_timestamp >= dare.deadline {
            // Dare expired - "Won't do" bettors win
            dare.is_expired = true;
            if bet.bet_type == BetType::WontDo && dare.wont_do_pool > 0 {
                payout = (bet.amount * available_pool) / dare.wont_do_pool;
            }
        } else {
            return Err(ErrorCode::DareNotFinalized.into());
        }

        require!(payout > 0, ErrorCode::NoPayout);

        // Transfer SOL winnings from pool to winner
        let dare_key = dare.key();
        let seeds = &[
            b"pool",
            dare_key.as_ref(),
            &[ctx.bumps.pool_account],
        ];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.pool_account.to_account_info(),
                to: ctx.accounts.winner.to_account_info(),
            },
            signer,
        );
        system_program::transfer(cpi_context, payout)?;

        bet.is_claimed = true;

        Ok(())
    }

    pub fn claim_winner_reward(ctx: Context<ClaimWinnerReward>) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        let proof_submission = &mut ctx.accounts.proof_submission;
        
        require!(dare.is_completed, ErrorCode::DareNotCompleted);
        require!(dare.winners_selected, ErrorCode::DareNotFinalized);
        require!(!proof_submission.reward_claimed, ErrorCode::AlreadyClaimed);
        
        // Verify this submission is a winner
        require!(proof_submission.is_winner, ErrorCode::NotSubmitter);
        require!(
            proof_submission.submitter == ctx.accounts.winner.key(),
            ErrorCode::NotSubmitter
        );

        let creator_fee = dare.total_pool * 2 / 100;
        let available_pool = dare.total_pool - creator_fee;
        
        // Calculate reward based on winner rank
        let reward_percentage = match proof_submission.winner_rank {
            1 => 30, // 1st place: 30%
            2 => 15, // 2nd place: 15%
            3 => 5,  // 3rd place: 5%
            _ => return Err(ErrorCode::InvalidWinnerRank.into()),
        };
        
        let winner_reward = available_pool * reward_percentage / 100;

        // Transfer SOL reward from pool to winner
        let dare_key = dare.key();
        let seeds = &[
            b"pool",
            dare_key.as_ref(),
            &[ctx.bumps.pool_account],
        ];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.pool_account.to_account_info(),
                to: ctx.accounts.winner.to_account_info(),
            },
            signer,
        );
        system_program::transfer(cpi_context, winner_reward)?;

        // Mark as claimed
        proof_submission.reward_claimed = true;
        
        // Update dare claimed status
        match proof_submission.winner_rank {
            1 => dare.first_place_claimed = true,
            2 => dare.second_place_claimed = true,
            3 => dare.third_place_claimed = true,
            _ => {},
        }

        Ok(())
    }

    pub fn cash_out_early(ctx: Context<CashOutEarly>) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        let bet = &mut ctx.accounts.bet;
        let current_time = Clock::get()?.unix_timestamp;
        
        require!(!bet.is_claimed, ErrorCode::AlreadyClaimed);
        require!(!dare.is_completed, ErrorCode::DareAlreadyCompleted);
        require!(current_time < dare.deadline, ErrorCode::DareExpired);
        
        // Check if within 10 minutes (600 seconds) of placing the bet
        let ten_minutes = 600;
        let time_since_bet = current_time - bet.bet_timestamp;
        require!(
            time_since_bet <= ten_minutes,
            ErrorCode::CashOutTooLate
        );

        // Calculate cash out amount with 10% penalty
        let penalty = bet.amount * 10 / 100; // 10% penalty
        let cash_out_amount = bet.amount - penalty;

        // Update dare pools by removing the bet amount
        match bet.bet_type {
            BetType::WillDo => dare.will_do_pool -= bet.amount,
            BetType::WontDo => dare.wont_do_pool -= bet.amount,
        }
        dare.total_pool -= bet.amount;

        // Transfer SOL cash out amount to bettor
        let dare_key = dare.key();
        let seeds = &[
            b"pool",
            dare_key.as_ref(),
            &[ctx.bumps.pool_account],
        ];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.pool_account.to_account_info(),
                to: ctx.accounts.bettor.to_account_info(),
            },
            signer,
        );
        system_program::transfer(cpi_context, cash_out_amount)?;

        // Mark bet as claimed to prevent double claiming
        bet.is_claimed = true;

        Ok(())
    }

    pub fn claim_creator_fee(ctx: Context<ClaimCreatorFee>) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        
        require!(!dare.creator_fee_claimed, ErrorCode::CreatorFeeAlreadyClaimed);
        require!(
            dare.is_completed || Clock::get()?.unix_timestamp >= dare.deadline,
            ErrorCode::DareNotFinalized
        );

        let creator_fee = dare.total_pool * 2 / 100;

        // Transfer SOL creator fee from pool to creator
        let dare_key = dare.key();
        let seeds = &[
            b"pool",
            dare_key.as_ref(),
            &[ctx.bumps.pool_account],
        ];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.pool_account.to_account_info(),
                to: ctx.accounts.creator.to_account_info(),
            },
            signer,
        );
        system_program::transfer(cpi_context, creator_fee)?;

        dare.creator_fee_claimed = true;

        Ok(())
    }

    pub fn like_proof_submission(ctx: Context<LikeProofSubmission>) -> Result<()> {
        let proof_submission = &mut ctx.accounts.proof_submission;
        
        // Increment likes count
        proof_submission.likes_count += 1;
        
        Ok(())
    }

    /// Emergency withdrawal function - ONLY for developer in critical situations
    /// This allows the developer to withdraw all funds from a dare's pool
    /// Use cases: Contract bug, stuck funds, security issue
    pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>) -> Result<()> {
        let dare = &mut ctx.accounts.dare;
        
        // CRITICAL: Only the hardcoded developer address can call this
        const DEVELOPER_PUBKEY: &str = "9DvhKAT7bn5n7YqRTTAgvgnmtxPro1qiTaHkz4vzn1cK";
        let developer_key = Pubkey::from_str(DEVELOPER_PUBKEY)
            .map_err(|_| ErrorCode::InvalidDeveloperKey)?;
        
        require!(
            ctx.accounts.developer.key() == developer_key,
            ErrorCode::UnauthorizedEmergencyWithdrawal
        );

        // Get total pool balance
        let pool_balance = ctx.accounts.pool_account.lamports();
        
        require!(pool_balance > 0, ErrorCode::EmptyPool);

        // Transfer all SOL from pool to developer
        let dare_key = dare.key();
        let seeds = &[
            b"pool",
            dare_key.as_ref(),
            &[ctx.bumps.pool_account],
        ];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.pool_account.to_account_info(),
                to: ctx.accounts.developer.to_account_info(),
            },
            signer,
        );
        system_program::transfer(cpi_context, pool_balance)?;

        // Mark dare as emergency withdrawn (optional flag)
        dare.is_expired = true; // Repurpose this flag to prevent further actions

        msg!("🚨 EMERGENCY WITHDRAWAL: {} SOL withdrawn by developer", pool_balance);

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String, description: String)]
pub struct CreateDare<'info> {
    #[account(
        init,
        payer = creator,
        space = Dare::LEN,
        seeds = [b"dare", creator.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub dare: Account<'info, Dare>,
    
    #[account(
        init,
        payer = creator,
        space = 0,
        seeds = [b"pool", dare.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA that will hold SOL
    pub pool_account: AccountInfo<'info>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub dare: Account<'info, Dare>,
    
    #[account(
        init,
        payer = bettor,
        space = Bet::LEN,
        seeds = [b"bet", dare.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    
    #[account(
        mut,
        seeds = [b"pool", dare.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA that holds SOL
    pub pool_account: AccountInfo<'info>,
    
    #[account(mut)]
    pub bettor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(proof_hash: String)]
pub struct SubmitProof<'info> {
    #[account(mut)]
    pub dare: Account<'info, Dare>,
    
    #[account(
        init,
        payer = submitter,
        space = ProofSubmission::LEN,
        seeds = [b"proof", dare.key().as_ref(), submitter.key().as_ref(), proof_hash.as_bytes()],
        bump
    )]
    pub proof_submission: Account<'info, ProofSubmission>,
    
    #[account(mut)]
    pub submitter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub dare: Account<'info, Dare>,
    
    #[account(
        mut,
        seeds = [b"bet", dare.key().as_ref(), winner.key().as_ref()],
        bump = bet.bump
    )]
    pub bet: Account<'info, Bet>,
    
    #[account(
        mut,
        seeds = [b"pool", dare.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA that holds SOL
    pub pool_account: AccountInfo<'info>,
    
    #[account(mut)]
    pub winner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimWinnerReward<'info> {
    #[account(mut)]
    pub dare: Account<'info, Dare>,
    
    #[account(
        mut,
        seeds = [b"proof", dare.key().as_ref(), winner.key().as_ref()],
        bump
    )]
    pub proof_submission: Account<'info, ProofSubmission>,
    
    #[account(
        mut,
        seeds = [b"pool", dare.key().as_ref()],
        bump
    )]
    pub pool_account: SystemAccount<'info>,
    
    #[account(mut)]
    pub winner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LikeProofSubmission<'info> {
    #[account(
        mut,
        seeds = [b"proof", dare.key().as_ref(), proof_submission.submitter.as_ref()],
        bump
    )]
    pub proof_submission: Account<'info, ProofSubmission>,
    
    pub dare: Account<'info, Dare>,
    
    #[account(mut)]
    pub liker: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimCompletionReward<'info> {
    #[account(mut)]
    pub dare: Account<'info, Dare>,
    
    #[account(
        mut,
        seeds = [b"pool", dare.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA that holds SOL
    pub pool_account: AccountInfo<'info>,
    
    #[account(mut)]
    pub submitter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CashOutEarly<'info> {
    #[account(mut)]
    pub dare: Account<'info, Dare>,
    
    #[account(
        mut,
        seeds = [b"bet", dare.key().as_ref(), bettor.key().as_ref()],
        bump = bet.bump
    )]
    pub bet: Account<'info, Bet>,
    
    #[account(
        mut,
        seeds = [b"pool", dare.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA that holds SOL
    pub pool_account: AccountInfo<'info>,
    
    #[account(mut)]
    pub bettor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimCreatorFee<'info> {
    #[account(
        mut,
        has_one = creator
    )]
    pub dare: Account<'info, Dare>,
    
    #[account(
        mut,
        seeds = [b"pool", dare.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA that holds SOL
    pub pool_account: AccountInfo<'info>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SelectWinners<'info> {
    #[account(mut)]
    pub dare: Account<'info, Dare>,
    
    pub platform_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ApproveProof<'info> {
    #[account(mut)]
    pub dare: Account<'info, Dare>,
    
    #[account(mut)]
    pub platform_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    #[account(mut)]
    pub dare: Account<'info, Dare>,
    
    #[account(
        mut,
        seeds = [b"pool", dare.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA that holds SOL - will be drained in emergency
    pub pool_account: AccountInfo<'info>,
    
    /// The developer wallet - hardcoded address check in function
    #[account(mut)]
    pub developer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Dare {
    pub creator: Pubkey,
    pub platform_authority: Pubkey, // Admin who can approve proofs and rank winners
    pub title: String,
    pub description: String,
    pub deadline: i64,
    pub min_bet: u64,
    pub total_pool: u64,
    pub will_do_pool: u64,
    pub wont_do_pool: u64,
    pub is_completed: bool,
    pub is_expired: bool,
    pub submission_count: u32, // Track number of submissions
    pub winners_selected: bool, // Whether admin has selected winners
    pub first_place_winner: Option<Pubkey>, // 1st place winner
    pub second_place_winner: Option<Pubkey>, // 2nd place winner  
    pub third_place_winner: Option<Pubkey>, // 3rd place winner
    pub first_place_claimed: bool,
    pub second_place_claimed: bool,
    pub third_place_claimed: bool,
    pub creator_fee_claimed: bool,
    pub bump: u8,
}

impl Dare {
    pub const LEN: usize = 8 + // discriminator
        32 + // creator
        32 + // platform_authority
        4 + 64 + // title (max 64 chars)
        4 + 256 + // description (max 256 chars)
        8 + // deadline
        8 + // min_bet
        8 + // total_pool
        8 + // will_do_pool
        8 + // wont_do_pool
        1 + // is_completed
        1 + // is_expired
        4 + // submission_count
        1 + // winners_selected
        1 + 32 + // first_place_winner (Option<Pubkey>)
        1 + 32 + // second_place_winner (Option<Pubkey>)
        1 + 32 + // third_place_winner (Option<Pubkey>)
        1 + // first_place_claimed
        1 + // second_place_claimed
        1 + // third_place_claimed
        1 + // creator_fee_claimed
        1; // bump
}

#[account]
pub struct Bet {
    pub dare: Pubkey,
    pub bettor: Pubkey,
    pub amount: u64,
    pub bet_type: BetType,
    pub bet_timestamp: i64, // When the bet was placed
    pub is_claimed: bool,
    pub bump: u8,
}

impl Bet {
    pub const LEN: usize = 8 + // discriminator
        32 + // dare
        32 + // bettor
        8 + // amount
        1 + // bet_type
        8 + // bet_timestamp
        1 + // is_claimed
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CompletionProof {
    pub submitter: Pubkey,
    pub proof_hash: String,
    pub proof_description: String,
    pub timestamp: i64,
    pub is_approved: bool,
    pub approved_by: Option<Pubkey>,
    pub approval_timestamp: Option<i64>,
}

#[account]
pub struct ProofSubmission {
    pub dare: Pubkey,
    pub submitter: Pubkey,
    pub proof_hash: String,
    pub proof_description: String,
    pub submission_timestamp: i64,
    pub is_approved: bool, // Admin approval
    pub approved_by: Pubkey,
    pub approval_timestamp: i64,
    pub likes_count: u32, // Social engagement metric
    pub is_winner: bool, // Whether this submission won (1st, 2nd, or 3rd)
    pub winner_rank: u8, // 1 = first, 2 = second, 3 = third, 0 = not winner
    pub reward_claimed: bool,
    pub bump: u8,
}

impl ProofSubmission {
    pub const LEN: usize = 8 + // discriminator
        32 + // dare
        32 + // submitter
        4 + 64 + // proof_hash (max 64 chars)
        4 + 256 + // proof_description (max 256 chars)
        8 + // submission_timestamp
        1 + // is_approved
        32 + // approved_by
        8 + // approval_timestamp
        4 + // likes_count
        1 + // is_winner
        1 + // winner_rank
        1 + // reward_claimed
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum BetType {
    WillDo,
    WontDo,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Bet amount is below minimum")]
    BetTooLow,
    #[msg("Dare has expired")]
    DareExpired,
    #[msg("Dare is already completed")]
    DareAlreadyCompleted,
    #[msg("Winnings have already been claimed")]
    AlreadyClaimed,
    #[msg("Dare is not finalized yet")]
    DareNotFinalized,
    #[msg("No payout available")]
    NoPayout,
    #[msg("Dare is not completed")]
    DareNotCompleted,
    #[msg("Not the submitter of the proof")]
    NotSubmitter,
    #[msg("Creator fee has already been claimed")]
    CreatorFeeAlreadyClaimed,
    #[msg("Cash out window expired - only available for 10 minutes after placing bet")]
    CashOutTooLate,
    #[msg("No proof has been submitted")]
    NoProofSubmitted,
    #[msg("Proof has not been approved yet")]
    ProofNotApproved,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Maximum submissions reached")]
    MaxSubmissionsReached,
    #[msg("Invalid winner rank")]
    InvalidWinnerRank,
    #[msg("Winners already selected")]
    WinnersAlreadySelected,
    #[msg("Unauthorized platform authority")]
    UnauthorizedPlatformAuthority,
    #[msg("Invalid developer key format")]
    InvalidDeveloperKey,
    #[msg("🚨 UNAUTHORIZED: Only developer can perform emergency withdrawal")]
    UnauthorizedEmergencyWithdrawal,
    #[msg("Pool is empty - nothing to withdraw")]
    EmptyPool,
}