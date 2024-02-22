import * as anchor from '@project-serum/anchor'
import {
  Connection,
  Commitment,
  ConnectionConfig,
  SystemProgram,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'

import CONFIG from "../../config";
import { getParsedNftAccountsByOwner, getParsedAccountByMint } from '@nfteyez/sol-rayz';
import { getMetadataAccount } from '../../utils';
import { Program } from '@project-serum/anchor';
import { makeTransaction } from '../../helper/composables/sol/connection';
import { DECIMAL } from '@/config/dev';
import { report } from 'process';
// const Promise = require('bluebird') ;

const {
  CLUSTER_API,
  OWNER_WALLET,
  NEWS
} = CONFIG;

const connection = new Connection(CLUSTER_API, {
  skipPreflight: true,
  preflightCommitment: 'confirmed' as Commitment,
} as ConnectionConfig);

export const deposit = async (
  wallet: any,
  price: number
) => {
  try {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    const program = new anchor.Program(NEWS.IDL, NEWS.ID, provider);

    const [ownerVault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.OWNER_VAULT_SEED),
      wallet.publicKey.toBuffer()
    ], new PublicKey(NEWS.ID))


    let instructions: any[] = [], signers: any[] = [];
    let transactions: any[] = [];
    

    const ownerVaultInfo: any = await connection.getAccountInfo(ownerVault);
    console.log('ownerVault', ownerVault.toString());
    console.log('ownerVaultInfo', ownerVaultInfo);
    if (!ownerVaultInfo) {
      instructions.push(program.instruction.createOwnerVault({
        accounts: {
          owner: wallet.publicKey,
          ownerVault: ownerVault,
          systemProgram: SystemProgram.programId
        }
      }));
    }

    const _price = new anchor.BN(price * DECIMAL)

    instructions.push(program.instruction.deposit(_price, {
      accounts: {
        owner: wallet.publicKey,
        ownerVault: ownerVault,
        systemProgram: SystemProgram.programId
      }
    }));

    const transaction = await makeTransaction(connection, instructions, signers, wallet.publicKey)

    return transaction
  }
  catch (error) {
    console.log('========', error)
    return false;
  }
}


export const withdraw = async (
  wallet: any,
  amount: number,
) => {
  try {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    const program = new anchor.Program(NEWS.IDL, NEWS.ID, provider);

    const [ownerVault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.OWNER_VAULT_SEED),
      wallet.publicKey.toBuffer()
    ], new PublicKey(NEWS.ID))

    console.log('ownerVault', ownerVault.toString())
    const ownerVaultInfo: any = await connection.getAccountInfo(ownerVault);
    console.log('ownerVaultInfo', ownerVaultInfo);

    const price: any = new anchor.BN(amount * DECIMAL)

    let builder: any;
    try {
      builder = program.methods.withdraw(price);
    } catch (error) {
      console.log('error in approveNews method', error);
    }
    
    builder.accounts({
      owner: wallet.publicKey,
      ownerVault: ownerVault,
      systemProgram: SystemProgram.programId
    });

    let txId;
    
    try {
      txId = await builder.rpc();
      console.log('txId', txId)
    } catch(error) {
      console.log('error', error)
      return false
    }
    if (!txId) return false;

    return true;

  }
  catch (error) {
    console.log('error', error)
    return false;
  }
}

export const withdrawAll = async (
  wallet: any,
) => {
  try {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    const program = new anchor.Program(NEWS.IDL, NEWS.ID, provider);

    const [ownerVault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.OWNER_VAULT_SEED),
      wallet.publicKey.toBuffer()
    ], new PublicKey(NEWS.ID))

    console.log('ownerVault', ownerVault.toString())
    const ownerVaultInfo: any = await connection.getAccountInfo(ownerVault);
    console.log('ownerVaultInfo', ownerVaultInfo);
    
    let builder: any;
    try {
      builder = program.methods.withdrawAll();
    } catch (error) {
      console.log('error in approveNews method', error);
    }
    
    builder.accounts({
      owner: wallet.publicKey,
      ownerVault: ownerVault,
      systemProgram: SystemProgram.programId
    });

    let txId;
    
    try {
      txId = await builder.rpc();
      console.log('txId', txId)
    } catch(error) {
      console.log('error', error)
      return false
    }
    if (!txId) return false;

    return true;

  }
  catch (error) {
    console.log('error', error)
    return false;
  }
}

export const getOwnerVaultBalance = async (
  wallet: any,
) => {
  try {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    const program = new anchor.Program(NEWS.IDL, NEWS.ID, provider);

    const [ownerVault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.OWNER_VAULT_SEED),
      new PublicKey(OWNER_WALLET).toBuffer()
    ], new PublicKey(NEWS.ID))
    
    return (await connection.getBalance(new PublicKey(ownerVault))) / LAMPORTS_PER_SOL
  }
  catch (error) {
    console.log('error', error)
    return false;
  }
}

export const createAdminReporter = async (
  wallet: any,
  admin: string
) => {
  try {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    const program = new anchor.Program(NEWS.IDL, NEWS.ID, provider);

    const [user] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.USER_SEED),
      wallet.publicKey.toBuffer()
    ], new PublicKey(NEWS.ID))

    let instructions: any[] = [], signers: any[] = [];
    let transactions: any[] = [];
    
    const userInfo: any = await connection.getAccountInfo(user);
    console.log('userInfo', userInfo);
    if (!userInfo) {
      instructions.push(program.instruction.createUser({
        accounts: {
          owner: wallet.publicKey,
          user: user,
          systemProgram: SystemProgram.programId
        }
      }));
    }

    instructions.push(program.instruction.createAdmin({
      accounts: {
        owner: wallet.publicKey,
        admin: new PublicKey(admin),
        user: user,
        systemProgram: SystemProgram.programId
      }
    }));

    const transaction = await makeTransaction(connection, instructions, signers, wallet.publicKey)

    return transaction
    

  }
  catch (error) {
    return false;
  }
}

export const createSeniorReporter = async (
  wallet: any,
  senior: string
) => {
  try {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    const program = new anchor.Program(NEWS.IDL, NEWS.ID, provider);

    const [user] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.USER_SEED),
      wallet.publicKey.toBuffer()
    ], new PublicKey(NEWS.ID))

    let instructions: any[] = [], signers: any[] = [];
    let transactions: any[] = [];

    instructions.push(program.instruction.createSenior({
      accounts: {
        admin: wallet.publicKey,
        senior: new PublicKey(senior),
        user: user,
        systemProgram: SystemProgram.programId
      }
    }));

    const transaction = await makeTransaction(connection, instructions, signers, wallet.publicKey)

    return transaction
    

  }
  catch (error) {
    return false;
  }
}

export const editReporter = async (
  wallet: any,
  reporter: string,
  role: string
) => {

  try {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)

    const program: any = new anchor.Program(NEWS.IDL, NEWS.ID, provider);

    const [user] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.USER_SEED),
      new PublicKey(OWNER_WALLET).toBuffer()
    ], new PublicKey(NEWS.ID))
    

    let instructions: any[] = [], signers: any[] = [];
    let transactions: any[] = [];
    
    const userInfo: any = await connection.getAccountInfo(user);
    console.log('userInof', userInfo)

    if (!userInfo) {
      instructions.push(program.instruction.createUser({
        accounts: {
          owner: new PublicKey(OWNER_WALLET),
          user: user,
          systemProgram: SystemProgram.programId
        }
      }));
    }
    let roleNum = 0;
    if(role === 'admin')
      roleNum = 2;
    else if (role === 'senior') 
      roleNum = 1;

    instructions.push(program.instruction.editReporter(roleNum, {
      accounts: {
        // owner: new PublicKey(OWNER_WALLET),
        owner: wallet.publicKey,
        oldReporter: new PublicKey(reporter),
        reporter: new PublicKey(reporter),
        user: user,
        systemProgram: SystemProgram.programId
      }
    }));

    const transaction = await makeTransaction(connection, instructions, signers, wallet.publicKey)

    return transaction
  }
  catch (error) {
    console.log('error', error)
    return false;
  }
}

export const deleteReporter = async (
  wallet: any,
  reporter: string
) => {
  try {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)

    const program: any = new anchor.Program(NEWS.IDL, NEWS.ID, provider);

    const [user] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.USER_SEED),
      wallet.publicKey.toBuffer()
    ], new PublicKey(NEWS.ID))

    let builder: any;
    try {
      builder = program.methods.deleteReporter();
    } catch (error) {
      console.log('error in delete method', error);
    }
    
    builder.accounts({
      admin: wallet.publicKey,
      reporter: new PublicKey(reporter),
      user: user,
      systemProgram: SystemProgram.programId
    });
    let txId;
    try {
      txId = await builder.rpc();
    } catch(error) {
    }
    if (!txId) return false;

    return true;
  }
  catch (error) {
    console.log('error', error)
    return false;
  }
}


export const createForNews = async (
  wallet: any,
  id: any
) => {
  try {
    const newsId = new anchor.BN(id)
 
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    console.log("connection", connection)
    const program = new anchor.Program(NEWS.IDL, NEWS.ID, provider);
    console.log("program", program)


    console.log("reporer", wallet.publicKey.toString())

    const [pool] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.POOL_SEED),
      newsId.toArrayLike(Buffer, 'le', 8),
      wallet.publicKey.toBuffer()
    ], new PublicKey(NEWS.ID))

    const [vault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.VAULT_SEED),
      wallet.publicKey.toBuffer()
    ], new PublicKey(NEWS.ID))


    let instructions: any[] = [], signers: any[] = [];
    let transactions: any[] = [];
    

    const vaultInfo: any = await connection.getAccountInfo(vault);
    console.log('vaultInfo', vaultInfo);
    if (!vaultInfo) {
      instructions.push(program.instruction.createVault({
        accounts: {
          reporter: wallet.publicKey,
          vault: vault,
          systemProgram: SystemProgram.programId
        }
      }));
    }

    instructions.push(program.instruction.createNews(newsId, {
      accounts: {
        reporter: wallet.publicKey,
        pool: pool,
        systemProgram: SystemProgram.programId
      }
    },));

    const transaction = await makeTransaction(connection, instructions, signers, wallet.publicKey)

    return transaction
    

  }
  catch (error) {
    console.log('========', error)
    return false;
  }
}

export const approveForNews = async (
  wallet: any,
  reporter: string,
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
    const [pool] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.POOL_SEED),
      newsId.toArrayLike(Buffer, 'le', 8),
      new PublicKey(reporter).toBuffer()
    ], new PublicKey(NEWS.ID))

    const [user] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.USER_SEED),
      new PublicKey(OWNER_WALLET).toBuffer()
    ], new PublicKey(NEWS.ID))

    let builder: any;
    try {
      builder = program.methods.approveNews();
    } catch (error) {
      console.log('error in approveNews method', error);
    }
    
    builder.accounts({
      senior: wallet.publicKey,
      pool: pool,
      user: user
      // systemProgram: SystemProgram.programId
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
    console.log('error', error)
    return false;
  }
}

export const denyForNews = async (
  wallet: any,
  reporter: string,
  id: any
) => {
  try {
    const newsId = new anchor.BN(id)
    console.log("newsId", newsId)
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    const program: any = new anchor.Program(NEWS.IDL, NEWS.ID, provider);
    const [pool] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.POOL_SEED),
      newsId.toArrayLike(Buffer, 'le', 8),
      new PublicKey(reporter).toBuffer()
    ], new PublicKey(NEWS.ID))

    const [user] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.USER_SEED),
      new PublicKey(OWNER_WALLET).toBuffer()
    ], new PublicKey(NEWS.ID))

    let builder: any;
    try {
      builder = program.methods.denyNews();
    } catch (error) {
      console.log('error in approveNews method', error);
    }
    
    builder.accounts({
      senior: wallet.publicKey,
      pool: pool,
      user: user
      // systemProgram: SystemProgram.programId
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
    console.log('error', error)
    return false;
  }
}

export const publishForNews = async (
  wallet: any,
  reporter: string,
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
    const [pool] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.POOL_SEED),
      newsId.toArrayLike(Buffer, 'le', 8),
      new PublicKey(reporter).toBuffer()
    ], new PublicKey(NEWS.ID))

    const [vault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.VAULT_SEED),
      new PublicKey(reporter).toBuffer()
    ], new PublicKey(NEWS.ID))

    const [user] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.USER_SEED),
      new PublicKey(OWNER_WALLET).toBuffer()
    ], new PublicKey(NEWS.ID))

    console.log('pool', pool.toString())
    // const poolData: any = await program.account.pool.fetch(pool);
    // console.log('poolData', poolData)

    let builder: any;
    try {
      builder = program.methods.publishNews();
    } catch (error) {
      console.log('error in approveNews method', error);
    }
    
    builder.accounts({
      admin: wallet.publicKey,
      pool: pool,
      vault: vault,
      user: user,
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
    console.log('error', error)
    return false;
  }
}

export const payoutForJunior = async (
  wallet: any,
  reporter: string
) => {
  try {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    console.log("connection", connection)
    const program: any = new anchor.Program(NEWS.IDL, NEWS.ID, provider);
    console.log("program", program)
    const [vault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.VAULT_SEED),
      new PublicKey(reporter).toBuffer()
    ], new PublicKey(NEWS.ID))

    const [user] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.USER_SEED),
      new PublicKey(OWNER_WALLET).toBuffer()
    ], new PublicKey(NEWS.ID))

    const [ownerVault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.OWNER_VAULT_SEED),
      new PublicKey(OWNER_WALLET).toBuffer()
    ], new PublicKey(NEWS.ID))

    let builder: any;
    try {
      builder = program.methods.payoutJunior();
    } catch (error) {
      console.log('error in approveNews method', error);
    }
    
    builder.accounts({
      admin: wallet.publicKey,
      junior: new PublicKey(reporter),
      vault: vault,
      user: user,
      ownerVault: ownerVault,
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
    console.log('error', error)
    return false;
  }
}

export const payoutForAll = async (
  wallet: any,
  juniors: any[]
) => {
  try {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)

    const program = new anchor.Program(NEWS.IDL, NEWS.ID, provider);

    const [user] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.USER_SEED),
      new PublicKey(OWNER_WALLET).toBuffer()
    ], new PublicKey(NEWS.ID))

    const [ownerVault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.OWNER_VAULT_SEED),
      new PublicKey(OWNER_WALLET).toBuffer()
    ], new PublicKey(NEWS.ID))


    let instructions: any = [], signers: any = [];
    for(let i = 0; i < juniors.length; i++) { 
    
      const [vault] = await PublicKey.findProgramAddress([
        Buffer.from(NEWS.VAULT_SEED),
        new PublicKey(juniors[i]._doc.wallet).toBuffer()
      ], new PublicKey(NEWS.ID))
  
      instructions.push(program.instruction.payoutJunior({
        accounts: {
          admin: wallet.publicKey,
          junior: new PublicKey(juniors[i]._doc.wallet),
          vault: vault,
          user: user,
          ownerVault: ownerVault,
          systemProgram: SystemProgram.programId
        }
      }))
    }
    const transaction = await makeTransaction(connection, instructions, signers, wallet.publicKey)
  
    return transaction

  }
  catch (error) {
    console.log('error', error)
    return null;
  }
}

export const sendTipForJunior = async (
  wallet: any,
  reporter: string,
  amount: number
) => {
  try {
    console.log("reporter", reporter)
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    console.log("connection", connection)
    const program: any = new anchor.Program(NEWS.IDL, NEWS.ID, provider);
    console.log("program", program)
    const [vault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.VAULT_SEED),
      new PublicKey(reporter).toBuffer()
    ], new PublicKey(NEWS.ID))

    console.log('vault', vault.toString())
    // const poolData: any = await program.account.pool.fetch(pool);
    // console.log('poolData', poolData)

    let builder: any;
    let price = new anchor.BN(amount * DECIMAL)

    try {
      builder = program.methods.sendTip(price);
    } catch (error) {
      console.log('error in approveNews method', error);
    }
    
    builder.accounts({
      user: wallet.publicKey,
      reporter: new PublicKey(reporter)
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
    console.log('error', error)
    return false;
  }
}

export const sendMintFeeForNews = async (
  wallet: any,
  amount: number
) => {
  try {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    console.log("connection", connection)
    const program: any = new anchor.Program(NEWS.IDL, NEWS.ID, provider);
    console.log("program", program)
    const [vault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.VAULT_SEED),
      new PublicKey(wallet.publicKey).toBuffer()
    ], new PublicKey(NEWS.ID))

    console.log('vault', vault.toString())
    // const poolData: any = await program.account.pool.fetch(pool);
    // console.log('poolData', poolData)

    let builder: any;
    let price = new anchor.BN(amount * DECIMAL)

    try {
      builder = program.methods.sendMintFee(price);
    } catch (error) {
      console.log('error in approveNews method', error);
    }
    
    builder.accounts({
      reporter: wallet.publicKey,
      owner: new PublicKey(OWNER_WALLET)
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
    console.log('error', error)
    return false;
  }
}


export const setMintFeeForNews = async (
  wallet: any,
  price: number
) => {
  try {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    const program = new anchor.Program(NEWS.IDL, NEWS.ID, provider);

    const [vault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.VAULT_SEED),
      wallet.publicKey.toBuffer()
    ], new PublicKey(NEWS.ID))


    let instructions: any[] = [], signers: any[] = [];
    let transactions: any[] = [];
    

    const vaultInfo: any = await connection.getAccountInfo(vault);
    console.log('vaultInfo', vaultInfo);
    if (!vaultInfo) {
      instructions.push(program.instruction.createVault({
        accounts: {
          reporter: wallet.publicKey,
          vault: vault,
          systemProgram: SystemProgram.programId
        }
      }));
    }

    const _price = new anchor.BN(price * DECIMAL)

    instructions.push(program.instruction.editVault(_price, {
      accounts: {
        owner: wallet.publicKey,
        vault: vault,
        systemProgram: SystemProgram.programId
      }
    },));

    const transaction = await makeTransaction(connection, instructions, signers, wallet.publicKey)

    return transaction
    

  }
  catch (error) {
    console.log('========', error)
    return false;
  }
}

export const getMintPrice = async (wallet: any) => {
  const provider = new anchor.AnchorProvider(connection, wallet, {
      skipPreflight: true,
      preflightCommitment: 'confirmed' as Commitment,
    } as ConnectionConfig)
    console.log("connection", connection)
    const program: any = new anchor.Program(NEWS.IDL, NEWS.ID, provider);
    console.log("program", program)

    const [vault] = await PublicKey.findProgramAddress([
      Buffer.from(NEWS.VAULT_SEED),
      new PublicKey(OWNER_WALLET).toBuffer()
    ], new PublicKey(NEWS.ID))

    console.log('vault', vault.toString())
    let vaultData: any 
    try {
      vaultData = await program.account.vault.fetch(vault);
      
    } catch(error) {
      return 0
    }
    console.log('vaultData', vaultData)
    let result = vaultData?.balance.toNumber() / DECIMAL
    return result
}