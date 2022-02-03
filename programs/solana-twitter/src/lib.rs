use anchor_lang::prelude::*;

declare_id!("6DAtUVDGwUrV5xEtRxyYXGG6kvskeFQuhDNyt7E38yhx");

#[program]
pub mod solana_twitter {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
