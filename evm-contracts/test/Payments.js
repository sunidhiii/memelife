const { expect } = require("chai");

describe("Payments Contract", function () {
  let owner;
  let wallets;
  let percentages;
  let token;
  let payments;

  before(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    // Deploy ERC20 token
    const Token = await ethers.getContractFactory("USDC_Token");
    token = await Token.deploy(owner);

    // Deploy Payments contract
    const Payments = await ethers.getContractFactory("Payments");
    payments = await Payments.deploy();
  });

  it("should split ETH value correctly", async function () {
    wallets = [await owner.getAddress(), await alice.getAddress()];
    percentages = [50, 50];
    await payments.connect(owner).setSplits(wallets, percentages);

    const tx = await payments.connect(owner).buyWithEth({ value: 1 });
    await tx.wait();

  });

  it("should split token value correctly", async function () {
    wallets = [await owner.getAddress(), await alice.getAddress()];
    percentages = [50, 50];
    await payments.connect(owner).setSplits(wallets, percentages);
    await token.connect(owner).mint(await bob.getAddress(), 10000000000);

    await token.connect(bob).approve(payments.address, 100);
    const tx = await payments.connect(bob).buyWithToken(token.address, 100);
    await tx.wait();

  });

});
