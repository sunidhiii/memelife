const { expect, use } = require("chai");

describe("Payments", function () {
  let owner;
  let wallets;
  let percentages;
  let token;
  let payments;
  // let addressZero = '0x0000000000000000000000000000000000000000';
  let userAddress = "HrvDUrVTeg5AL7vRMkkvqZGdYgYgBsBBwopr42nZQRca";

  before(async function () {
    [owner, alice, bob, admin1, admin2, admin3, admin4] = await ethers.getSigners();

    // Deploy USDC token
    const USDC_Token = await ethers.getContractFactory("Token");
    usdc_token = await USDC_Token.deploy("USDC_Token", "USDC");

    // Deploy USDT token
    const USDT_Token = await ethers.getContractFactory("Token");
    usdT_token = await USDT_Token.deploy("USDT_Token", "USDT");

    // Deploy Payments contract
    const Payments = await ethers.getContractFactory("Payments");
    payments = await Payments.deploy(
      await usdc_token.getAddress(),
      await usdT_token.getAddress()
    );
  });

  it("should split Token value correctly", async function () {

    // get admin balances before transfer
    const admin1Bal = await usdT_token.balanceOf(await admin1.getAddress());
    const admin2Bal = await usdT_token.balanceOf(await admin2.getAddress());
    const admin3Bal = await usdT_token.balanceOf(await admin3.getAddress());

    console.log("Token Balance before withdraw:", admin1Bal, admin2Bal, admin3Bal);

    // set distribution percentages for 3 admins
    wallets = [
      await admin1.getAddress(),
      await admin2.getAddress(),
      await admin3.getAddress(),
    ];
    percentages = [20, 30, 50];
    await payments.connect(owner).setSplits(wallets, percentages);

    // transfer 100 tokens to the contract
    await usdT_token.connect(owner).mint(await bob.getAddress(), ethers.parseEther("100"));
    await usdT_token.connect(bob).approve(await payments.getAddress(), ethers.parseEther("100"));
    const tx = await payments.connect(bob).buyWithToken(userAddress, 1, ethers.parseEther("100"));
    await tx.wait();

    // withdraw token called by admin1
    await payments.connect(admin1).withdrawToken(1);

    // check balance after withdrawal
    const admin1BalAfter = await usdT_token.balanceOf(await admin1.getAddress());
    const admin2BalAfter = await usdT_token.balanceOf(await admin2.getAddress());
    const admin3BalAfter = await usdT_token.balanceOf(await admin3.getAddress());

    console.log("Token balance after withdraw:", parseInt(ethers.formatEther(admin1BalAfter)), parseInt(ethers.formatEther(admin2BalAfter)), parseInt(ethers.formatEther(admin3BalAfter)));
    
  });

  it("should split eth value correctly", async function () {
    
    // get admin balances before transfer
    const admin1Bal = await ethers.provider.getBalance(await admin4.getAddress());
    const admin2Bal = await ethers.provider.getBalance(await admin2.getAddress());
    const admin3Bal = await ethers.provider.getBalance(await admin3.getAddress());

    console.log("Ether Balance before withdraw:", ethers.formatEther(admin1Bal), ethers.formatEther(admin2Bal), ethers.formatEther(admin3Bal));

    // set distribution percentages for all 3 admins
    wallets = [
      await admin4.getAddress(),
      await admin2.getAddress(),
      await admin3.getAddress(),
    ];
    percentages = [40, 50, 10];
    await payments.connect(owner).setSplits(wallets, percentages);

    // transfer 1 eth to the contract
    const tx = await payments.connect(alice).buyWithEth(userAddress, { value: ethers.parseEther("1")});
    await tx.wait();

    // withdraw eth called by admin1
    await payments.connect(admin4).withdrawEth();

    // check balance after withdrawal
    const admin1BalAfter = await ethers.provider.getBalance(await admin4.getAddress());
    const admin2BalAfter = await ethers.provider.getBalance(await admin2.getAddress());
    const admin3BalAfter = await ethers.provider.getBalance(await admin3.getAddress());

    console.log("Ether balance after withdraw:", parseFloat(ethers.formatEther(admin1BalAfter)).toFixed(4), ethers.formatEther(admin2BalAfter), parseFloat(ethers.formatEther(admin3BalAfter)).toFixed(1));
    
  });
});
