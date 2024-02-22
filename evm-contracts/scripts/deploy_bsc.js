const hre = require("hardhat");

async function main() {

  // Mainnet
  // const usdt = "0x55d398326f99059fF775485246999027B3197955";     
  // const usdc = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

  //Testnet
  const usdt = "0x54F2c39929f9bAFd24Af2Cb5878868CDe883B8c8";     
  const usdc = "0x15e1D699F609C3B4ee2091C889c4ebe0dA9fF4CD";

  const Payments = await hre.ethers.getContractFactory("Payments");
  const payments = await Payments.deploy(usdt, usdc);
  // await payments.deployed();

  console.log(
    `Payment contract deployed to ${await payments.getAddress()}`
  );
  
  // Verify the smart contract using hardhat 
  await hre.run("verify:verify", {
    address: await payments.getAddress(),
    constructorArguments: [usdt, usdc],
  });

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
