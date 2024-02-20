const hre = require("hardhat");

async function main() {

  const payments_address = "0xe8E3032ca522557410AdC88713F2Cf67bf69cB9F";     

  // const payments = await (await ethers.getContractFactory("Payments")).attach(payments_address)
  const payments = await hre.ethers.getContractAt("Payments", payments_address);

  const depositEth = await payments.buyWithEth({ value: ethers.parseEther("0.0001") });

  console.log("Tx hash:", depositEth.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
