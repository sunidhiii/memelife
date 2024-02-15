use anchor_lang::prelude::*;
use std::ops::DerefMut;

declare_id!("7Xev9w6cvHkDXmDFB71LBWXP99bNXqnccTKXz2QZEeRz");

#[program]
pub mod deposit_withdraw {
    use super::*;


    #[derive(Accounts)]
    #[instruction(nonce: u8)]
    pub struct Initialize<'info> {
        authority: UncheckedAccount<'info>,
        owner: Signer<'info>,
        #[account(
            seeds = [
                pool.to_account_info().key.as_ref(),
            ],
            bump = nonce,
        )]
        pool_signer: UncheckedAccount<'info>,
        #[account(mut)]
        pool: Box<Account<'info, Pool>>,
        #[account(
            mut,
            seeds = [
                pool.to_account_info().key.as_ref(),
            ],
            bump = nonce,
        )]
        vault: AccountInfo<'info>,
        system_program: Program<'info, System>,
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> ProgramResult {
        if amount == 0 {
            return Err(ErrorCode::InvalidAmount.into());
        }

        ctx.accounts.pool.deposited_amount += amount;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
        let seeds = &[
            ctx.accounts.pool.to_account_info().key.as_ref(),
            &[ctx.accounts.pool.nonce],
        ];
        let _signer = &[&seeds[..]];
        let lamports = ctx.accounts.vault.to_account_info().lamports();

        if amount > lamports {
            return Err(ErrorCode::NotEnoughPoolAmount.into());
        }

        // Get the total deposited amount from the pool
        let _total_amount = ctx.accounts.pool.deposited_amount;

        // Define the percentages for each wallet
        let percentage_wallet1 = ctx.accounts.pool.percentage_wallet1;
        let percentage_wallet2 = ctx.accounts.pool.percentage_wallet2;
        let percentage_wallet3 = ctx.accounts.pool.percentage_wallet3;

        // Calculate the amount to be transferred to each wallet based on the percentages
        let transfer_amount_wallet1 = (amount * percentage_wallet1 as u64) / 100;
        let transfer_amount_wallet2 = (amount * percentage_wallet2 as u64) / 100;
        let transfer_amount_wallet3 = (amount * percentage_wallet3 as u64) / 100;

        // Create system transfer instructions for each transfer
        let ix_to_wallet1 = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.vault.key(),
            &ctx.accounts.wallet1.key(),
            transfer_amount_wallet1,
        );

        let ix_to_wallet2 = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.vault.key(),
            &ctx.accounts.wallet2.key(),
            transfer_amount_wallet2,
        );

        let ix_to_wallet3 = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.vault.key(),
            &ctx.accounts.wallet3.key(),
            transfer_amount_wallet3,
        );

        // Invoke the transfer instructions
        anchor_lang::solana_program::program::invoke(&ix_to_wallet1, &[
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.wallet1.to_account_info(),
        ])?;

        anchor_lang::solana_program::program::invoke(&ix_to_wallet2, &[
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.wallet2.to_account_info(),
        ])?;

        anchor_lang::solana_program::program::invoke(&ix_to_wallet3, &[
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.wallet3.to_account_info(),
        ])?;

        Ok(())
    }

    // Add a method to modify the percentages if needed
    pub fn modify_percentages(
        ctx: Context<ModifyPercentages>,
        percentage_wallet1: u8,
        percentage_wallet2: u8,
        percentage_wallet3: u8,
    ) -> ProgramResult {
        let pool = ctx.accounts.pool.deref_mut();

        // Check if the caller is the owner
        if *ctx.accounts.owner.key != pool.authority {
            return Err(ErrorCode::Unauthorized.into());
        }

        // Check if the percentages are within a valid range (0-100) and if they add up to 100
        if percentage_wallet1 > 100
            || percentage_wallet2 > 100
            || percentage_wallet3 > 100
            || percentage_wallet1 + percentage_wallet2 + percentage_wallet3 != 100
        {
            return Err(ErrorCode::InvalidPercentages.into());
        }

        // Update the percentages
        pool.percentage_wallet1 = percentage_wallet1;
        pool.percentage_wallet2 = percentage_wallet2;
        pool.percentage_wallet3 = percentage_wallet3;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(nonce: u8)]
pub struct Initialize<'info> {
    authority: UncheckedAccount<'info>,
    owner: Signer<'info>,
    #[account(
        seeds = [
            pool.to_account_info().key.as_ref(),
        ],
        bump = nonce,
    )]
    pool_signer: UncheckedAccount<'info>,

    #[account(mut)]
    pool: Box<Account<'info, Pool>>,
    #[account(
        mut,
        seeds = [
            pool.to_account_info().key.as_ref(),
        ],
        bump = nonce,
    )]
    vault: AccountInfo<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    // Existing accounts
    #[account(mut, has_one = vault)]
    pool: Box<Account<'info, Pool>>,
    #[account(mut)]
    vault: AccountInfo<'info>,
    #[account(mut)]
    depositor: AccountInfo<'info>,
    #[account(seeds = [pool.to_account_info().key.as_ref()], bump = pool.nonce)]
    pool_signer: UncheckedAccount<'info>,
    system_program: Program<'info, System>,
    #[account(mut)]
    wallet1: AccountInfo<'info>,
    #[account(mut)]
    wallet2: AccountInfo<'info>,
    #[account(mut)]
    wallet3: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        has_one = vault,
    )]
    pool: Box<Account<'info, Pool>>,
    #[account(mut)]
    vault: AccountInfo<'info>,
    #[account(
        mut,
        constraint = pool.authority == receiver.key(),
    )]
    receiver: AccountInfo<'info>,
    #[account(
        seeds = [
            pool.to_account_info().key.as_ref(),
        ],
        bump = pool.nonce,
    )]
    pool_signer: UncheckedAccount<'info>,
    system_program: Program<'info, System>,
    #[account(mut)]
    wallet1: AccountInfo<'info>,
    #[account(mut)]
    wallet2: AccountInfo<'info>,
    #[account(mut)]
    wallet3: AccountInfo<'info>,
}

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub nonce: u8,
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub percentage_wallet1: u8,
    pub percentage_wallet2: u8,
    pub percentage_wallet3: u8,
    pub deposited_amount: u64, // Track the total deposited amount
}

#[derive(Accounts)]
pub struct ModifyPercentages<'info> {
    owner: Signer<'info>,
    #[account(mut)]
    pool: Box<Account<'info, Pool>>,
}

#[error]
pub enum ErrorCode {
    #[msg("Pool amount is not enough.")]
    NotEnoughPoolAmount,

    #[msg("Invalid deposit amount.")]
    InvalidAmount,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Invalid percentages, they should add up to 100")]
    InvalidPercentages,
}