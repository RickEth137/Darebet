import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { 
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

describe("dare-betting", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.DareBetting as Program<any>;
  const provider = anchor.getProvider();

  let creator: Keypair;
  let bettor1: Keypair;
  let bettor2: Keypair;
  let submitter: Keypair;

  before(async () => {
    creator = Keypair.generate();
    bettor1 = Keypair.generate();
    bettor2 = Keypair.generate();
    submitter = Keypair.generate();

    // Airdrop SOL to test accounts
    const airdropAmount = 10 * LAMPORTS_PER_SOL;
    await Promise.all([
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(creator.publicKey, airdropAmount)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(bettor1.publicKey, airdropAmount)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(bettor2.publicKey, airdropAmount)
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(submitter.publicKey, airdropAmount)
      ),
    ]);
  });

  it("Creates a dare", async () => {
    const title = "Test Dare";
    const description = "This is a test dare for the betting platform";
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 3600);
    const minBet = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

    const [darePublicKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("dare"), creator.publicKey.toBuffer(), Buffer.from(title)],
      program.programId
    );

    const [poolAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), darePublicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .createDare(title, description, deadline, minBet)
      .accounts({
        dare: darePublicKey,
        poolAccount,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    const dareAccount = await program.account.dare.fetch(darePublicKey) as any;
    expect(dareAccount.creator.toString()).to.equal(creator.publicKey.toString());
    expect(dareAccount.title).to.equal(title);
    expect(dareAccount.description).to.equal(description);
    expect(dareAccount.totalPool.toString()).to.equal("0");
    expect(dareAccount.isCompleted).to.be.false;
  });

  it("Places bets on a dare", async () => {
    const title = "Test Dare";
    const betAmount1 = new anchor.BN(0.5 * LAMPORTS_PER_SOL);
    const betAmount2 = new anchor.BN(0.3 * LAMPORTS_PER_SOL);

    const [darePublicKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("dare"), creator.publicKey.toBuffer(), Buffer.from(title)],
      program.programId
    );

    const [bet1PublicKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), darePublicKey.toBuffer(), bettor1.publicKey.toBuffer()],
      program.programId
    );

    const [bet2PublicKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), darePublicKey.toBuffer(), bettor2.publicKey.toBuffer()],
      program.programId
    );

    const [poolAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), darePublicKey.toBuffer()],
      program.programId
    );

    // Bettor1 bets "WillDo"
    await program.methods
      .placeBet(betAmount1, { willDo: {} })
      .accounts({
        dare: darePublicKey,
        bet: bet1PublicKey,
        poolAccount,
        bettor: bettor1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettor1])
      .rpc();

    // Bettor2 bets "WontDo"
    await program.methods
      .placeBet(betAmount2, { wontDo: {} })
      .accounts({
        dare: darePublicKey,
        bet: bet2PublicKey,
        poolAccount,
        bettor: bettor2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettor2])
      .rpc();

    // Check accounts
    const dareAccount = await program.account.dare.fetch(darePublicKey) as any;
    expect(dareAccount.totalPool.toString()).to.equal(betAmount1.add(betAmount2).toString());
    expect(dareAccount.willDoPool.toString()).to.equal(betAmount1.toString());
    expect(dareAccount.wontDoPool.toString()).to.equal(betAmount2.toString());

    const bet1Account = await program.account.bet.fetch(bet1PublicKey) as any;
    expect(bet1Account.amount.toString()).to.equal(betAmount1.toString());
    expect(bet1Account.betType).to.deep.equal({ willDo: {} });

    const bet2Account = await program.account.bet.fetch(bet2PublicKey) as any;
    expect(bet2Account.amount.toString()).to.equal(betAmount2.toString());
    expect(bet2Account.betType).to.deep.equal({ wontDo: {} });
  });

  it("Submits proof and completes dare", async () => {
    const title = "Test Dare";
    const proofHash = "QmTestHash123";
    const proofDescription = "Video evidence of completing the dare";

    const [darePublicKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("dare"), creator.publicKey.toBuffer(), Buffer.from(title)],
      program.programId
    );

    await program.methods
      .submitProof(proofHash, proofDescription)
      .accounts({
        dare: darePublicKey,
        submitter: submitter.publicKey,
      })
      .signers([submitter])
      .rpc();

    const dareAccount = await program.account.dare.fetch(darePublicKey) as any;
    expect(dareAccount.isCompleted).to.be.true;
    expect(dareAccount.completionProof).to.not.be.null;
    expect(dareAccount.completionProof.submitter.toString()).to.equal(submitter.publicKey.toString());
    expect(dareAccount.completionProof.proofHash).to.equal(proofHash);
    expect(dareAccount.completionProof.proofDescription).to.equal(proofDescription);
  });

  it("Claims completion reward", async () => {
    const title = "Test Dare";

    const [darePublicKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("dare"), creator.publicKey.toBuffer(), Buffer.from(title)],
      program.programId
    );

    const [poolAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), darePublicKey.toBuffer()],
      program.programId
    );

    const balanceBefore = await provider.connection.getBalance(submitter.publicKey);

    await program.methods
      .claimCompletionReward()
      .accounts({
        dare: darePublicKey,
        poolAccount,
        submitter: submitter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([submitter])
      .rpc();

    const balanceAfter = await provider.connection.getBalance(submitter.publicKey);
    expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });

  it("Claims winnings for correct bettors", async () => {
    const title = "Test Dare";

    const [darePublicKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("dare"), creator.publicKey.toBuffer(), Buffer.from(title)],
      program.programId
    );

    const [bet1PublicKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), darePublicKey.toBuffer(), bettor1.publicKey.toBuffer()],
      program.programId
    );

    const [poolAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), darePublicKey.toBuffer()],
      program.programId
    );

    const balanceBefore = await provider.connection.getBalance(bettor1.publicKey);

    // Bettor1 should win since they bet "WillDo" and dare was completed
    await program.methods
      .claimWinnings()
      .accounts({
        dare: darePublicKey,
        bet: bet1PublicKey,
        poolAccount,
        winner: bettor1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettor1])
      .rpc();

    const balanceAfter = await provider.connection.getBalance(bettor1.publicKey);
    const bet1Account = await program.account.bet.fetch(bet1PublicKey) as any;
    
    expect(bet1Account.isClaimed).to.be.true;
    expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });

  it("Claims creator fee", async () => {
    const title = "Test Dare";

    const [darePublicKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("dare"), creator.publicKey.toBuffer(), Buffer.from(title)],
      program.programId
    );

    const [poolAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), darePublicKey.toBuffer()],
      program.programId
    );

    const balanceBefore = await provider.connection.getBalance(creator.publicKey);

    await program.methods
      .claimCreatorFee()
      .accounts({
        dare: darePublicKey,
        poolAccount,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const balanceAfter = await provider.connection.getBalance(creator.publicKey);
    const dareAccount = await program.account.dare.fetch(darePublicKey) as any;

    expect(dareAccount.creatorFeeClaimed).to.be.true;
    expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });

  it("Allows early cash out with penalty", async () => {
    const title = "Cash Out Test Dare";
    const description = "Testing cash out functionality";
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 7200); // 2 hours
    const minBet = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    const betAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);

    const [darePublicKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("dare"), creator.publicKey.toBuffer(), Buffer.from(title)],
      program.programId
    );

    const [poolAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), darePublicKey.toBuffer()],
      program.programId
    );

    // Create dare
    await program.methods
      .createDare(title, description, deadline, minBet)
      .accounts({
        dare: darePublicKey,
        poolAccount,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    // Place bet
    const [betPublicKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), darePublicKey.toBuffer(), bettor1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .placeBet(betAmount, { willDo: {} })
      .accounts({
        dare: darePublicKey,
        bet: betPublicKey,
        poolAccount,
        bettor: bettor1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettor1])
      .rpc();

    const balanceBefore = await provider.connection.getBalance(bettor1.publicKey);

    // Cash out early
    await program.methods
      .cashOutEarly()
      .accounts({
        dare: darePublicKey,
        bet: betPublicKey,
        poolAccount,
        bettor: bettor1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettor1])
      .rpc();

    const balanceAfter = await provider.connection.getBalance(bettor1.publicKey);
    const betAccount = await program.account.bet.fetch(betPublicKey) as any;
    const dareAccount = await program.account.dare.fetch(darePublicKey) as any;

    expect(betAccount.isClaimed).to.be.true;
    expect(dareAccount.totalPool.toString()).to.equal("0");
    expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });
});