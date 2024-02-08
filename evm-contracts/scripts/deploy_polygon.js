// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  // Mainnet
  // const usdt = "0x55d398326f99059fF775485246999027B3197955";     
  // const usdc = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

  //Testnet
  const usdt = "0x55d398326f99059fF775485246999027B3197955";     
  const usdc = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

  const Payments = await hre.ethers.getContractFactory("Payments");
  const payments = await Payments.deploy(usdt, usdc);
  // await payments.deployed();

  console.log(
    `Payment contract deployed to ${await payments.getAddress()}`
  );
  
  // Verify the smart contract using hardhat 
  await hre.run("verify:verify", {
    address: payments.address,
    constructorArguments: [usdt, usdc],
  });

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
