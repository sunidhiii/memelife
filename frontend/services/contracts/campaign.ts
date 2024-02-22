import * as anchor from '@project-serum/anchor'
import {
  Connection,
  Commitment,
  ConnectionConfig,
  SystemProgram,
  PublicKey,
  Keypair,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';

import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'

import CONFIG from "../../config";
import { getParsedNftAccountsByOwner, getParsedAccountByMint } from '@nfteyez/sol-rayz';
import { getMetadataAccount } from '../../utils';
import { Program } from '@project-serum/anchor';
import { makeTransaction } from '../../helper/composables/sol/connection';
import { signAndSendTransactions } from "../../helper/composables/sol/connection";
// const Promise = require('bluebird') ;

const {
  CLUSTER_API,
  NEWS,
  OWNER_WALLET
} = CONFIG;

const connection = new Connection(CLUSTER_API, {
  skipPreflight: true,
  preflightCommitment: 'confirmed' as Commitment,
} as ConnectionConfig);

export const createForCampaign = async (
  wallet: any,
  id: any,
  vault: any
) => {
  try {
    const campaignId = new anchor.BN(id)
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    console.log("connection", connection)
    const program = new anchor.Program(NEWS.IDL, NEWS.ID, provider);
    console.log("program", program)
    const [campaignpool] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.CAMPAIGN_SEED),
      campaignId.toArrayLike(Buffer, 'le', 8),
      wallet.publicKey.toBuffer()
    ], new PublicKey(NEWS.ID))

    let builder: any;
    try {
      builder = program.methods.createCampaign(campaignId);
    } catch (error) {
      console.log('error in createCampaign method', error);
    }
    
    builder.accounts({
      advertiser: wallet.publicKey,
      vault: Keypair.fromSecretKey(vault).publicKey,
      campaignPool: campaignpool,
      systemProgram: SystemProgram.programId
    });

    let txId;
    
    try {
      txId = await builder.rpc();
      console.log('txId', txId)
    } catch(error) {
      console.log('error', error)
    }
    if (!txId) return false;

    return true;

  }
  catch (error) {
    return false;
  }
}

export const approveForCampaign = async (
  wallet: any,
  advertiser: any,
  vault: any,
  id: any
) => {
  try {
    const newsId = new anchor.BN(id)
    console.log("newsId", newsId)
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    console.log("connection", connection)
    const program: any = new anchor.Program(NEWS.IDL, NEWS.ID, provider);
    console.log("program", program)
    const [campaiginpool] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.CAMPAIGN_SEED),
      newsId.toArrayLike(Buffer, 'le', 8),
      new PublicKey(advertiser).toBuffer()
    ], new PublicKey(NEWS.ID))

    const [user] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.USER_SEED),
      new PublicKey(OWNER_WALLET).toBuffer()
    ], new PublicKey(NEWS.ID))

    let instructions: any[] = [], signers: any[] = [];
    let transactions: any[] = [];

    instructions.push(program.instruction.approveCampaign({
      accounts: {
        admin: wallet.publicKey,
        vault: Keypair.fromSecretKey(vault).publicKey,
        campaignPool: campaiginpool,
        user:user,
        systemProgram: SystemProgram.programId
      }
    }));

    signers.push(Keypair.fromSecretKey(vault));
    const transaction = await makeTransaction(connection, instructions, signers, wallet.publicKey)
    transactions.push(transaction);
    let  res 
    try {
      res = await signAndSendTransactions(connection, wallet, transactions)
    } catch {
      return false
    }
    if (res?.txid && res?.slot) 
      return true
    else 
      return false 
    // let builder: any;
    // try {
    //   builder = program.methods.approveCampaign();
    // } catch (error) {
    //   console.log('error in approveNews method', error);
    // }
    
    // builder.accounts({
    //   admin: wallet.publicKey,
    //   vault: Keypair.fromSecretKey(vault).publicKey,
    //   pool: pool
    //   // systemProgram: SystemProgram.programId
    // });

    // let txId;
    
    // try {
    //   txId = await builder.rpc();

    //   console.log('txId', txId)
    // } catch(error) {
    //   console.log('error', error)
    // }
    // if (!txId) return false;

    // return true;

  }
  catch (error) {
    console.log('error', error)
    return false;
  }
}

export const denyForCampaign = async (
  wallet: any,
  advertiser: any,
  vault: any,
  id: any
) => {
  try {
    const newsId = new anchor.BN(id)

    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    console.log("connection", connection)
    const program: any = new anchor.Program(NEWS.IDL, NEWS.ID, provider);
    console.log("advertiser", advertiser)

    const [campaiginpool] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.CAMPAIGN_SEED),
      newsId.toArrayLike(Buffer, 'le', 8),
      new PublicKey(advertiser).toBuffer()
    ], new PublicKey(NEWS.ID))

    console.log("=========================")

    const [user] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.USER_SEED),
      new PublicKey(OWNER_WALLET).toBuffer()
    ], new PublicKey(NEWS.ID))

    // const poolData: any = await program.account.pool.fetch(pool);
    // console.log('poolData', poolData)
    let instructions: any[] = [], signers: any[] = [];
    let transactions: any[] = [];

    instructions.push(program.instruction.denyCampaign({
      accounts: {
        admin: wallet.publicKey,
        advertiser: new PublicKey(advertiser),
        vault: Keypair.fromSecretKey(vault).publicKey,
        campaignPool: campaiginpool,
        user: user,
        systemProgram: SystemProgram.programId
      }
    }));

    signers.push(Keypair.fromSecretKey(vault));
    const transaction = await makeTransaction(connection, instructions, signers, wallet.publicKey)
    transactions.push(transaction);
    let res 
    try {
      res = await signAndSendTransactions(connection, wallet, transactions)
    } catch (error) {
      return false
    }
    if (res?.txid && res?.slot) 
      return true
    else 
      return false 
    // let builder: any;
    // try {
    //   builder = program.methods.approveCampaign();
    // } catch (error) {
    //   console.log('error in approveNews method', error);
    // }
    
    // builder.accounts({
    //   admin: wallet.publicKey,
    //   vault: Keypair.fromSecretKey(vault).publicKey,
    //   pool: pool
    //   // systemProgram: SystemProgram.programId
    // });

    // let txId;
    
    // try {
    //   txId = await builder.rpc();

    //   console.log('txId', txId)
    // } catch(error) {
    //   console.log('error', error)
    // }
    // if (!txId) return false;

    // return true;

  }
  catch (error) {
    console.log('error', error)
    return false;
  }
}





