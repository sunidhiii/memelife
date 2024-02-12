use anchor_lang::prelude::*;

declare_id!("7Xev9w6cvHkDXmDFB71LBWXP99bNXqnccTKXz2QZEeRz");

#[program]
pub mod deposit_withdraw {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, nonce: u8) -> ProgramResult {

        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.vault = ctx.accounts.vault.key();
        pool.nonce = nonce;

        Ok(())
    }


    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> ProgramResult {
        // Ensure the amount is not zero
        if amount == 0 {
            return Err(ErrorCode::InvalidAmount.into());
        }

        // Calculate the amount to be transferred to each wallet
        let transfer_amount = amount / 3;

        // Create system transfer instructions for each transfer
        let ix_to_wallet1 = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.depositor.key(),
            &ctx.accounts.wallet1.key(),
            transfer_amount,
        );

        let ix_to_wallet2 = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.depositor.key(),
            &ctx.accounts.wallet2.key(),
            transfer_amount,
        );

        let ix_to_wallet3 = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.depositor.key(),
            &ctx.accounts.wallet3.key(),
            transfer_amount,
        );

        // Invoke the transfer instructions
        pub fn deposit(ctx: Context<Deposit>, amount: u64) -> ProgramResult {
            // Ensure the amount is not zero
            if amount == 0 {
                return Err(ErrorCode::InvalidAmount.into());
            }

            // Calculate the amount to be transferred to each wallet
            let transfer_amount = amount / 3;

            // Create system transfer instructions for each transfer
            let ix_to_wallet1 = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.depositor.key(),
                &ctx.accounts.wallet1.key(),
                transfer_amount,
            );

            let ix_to_wallet2 = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.depositor.key(),
                &ctx.accounts.wallet2.key(),
                transfer_amount,
            );

            let ix_to_wallet3 = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.depositor.key(),
                &ctx.accounts.wallet3.key(),
                transfer_amount,
            );

            // Invoke the transfer instructions
            anchor_lang::solana_program::program::invoke(&ix_to_wallet1, &[
                ctx.accounts.depositor.to_account_info(),
                ctx.accounts.wallet1.to_account_info(),
            ])?;

            anchor_lang::solana_program::program::invoke(&ix_to_wallet2, &[
                ctx.accounts.depositor.to_account_info(),
                ctx.accounts.wallet2.to_account_info(),
            ])?;

            anchor_lang::solana_program::program::invoke(&ix_to_wallet3, &[
                ctx.accounts.depositor.to_account_info(),
                ctx.accounts.wallet3.to_account_info(),
            ])?;

            Ok(())
        }

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
        let seeds = &[
            ctx.accounts.pool.to_account_info().key.as_ref(),
            &[ctx.accounts.pool.nonce],
        ];
        let signer = &[&seeds[..]];
        let lamports = ctx.accounts.vault.to_account_info().lamports();

        if amount > lamports {
            return Err(ErrorCode::NotEnoughPoolAmount.into());
        }

        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.vault.key(),
                &ctx.accounts.receiver.key(),
                amount
            ),
            &[
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.receiver.to_account_info(),
            ],
            signer,
        )?;

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
    #[account(
        zero,
    )]
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

    // New accounts for transferring to wallets
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
}

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub nonce: u8,
    pub vault: Pubkey,
}

#[error]
pub enum ErrorCode {
    #[msg("Pool amount is not enough.")]
    NotEnoughPoolAmount,

    #[msg("Invalid deposit amount.")]
    InvalidAmount,
}