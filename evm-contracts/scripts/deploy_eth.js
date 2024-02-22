const hre = require("hardhat");

async function main() {

  // Mainnet
  // const usdt = "0x55d398326f99059fF775485246999027B3197955";     
  // const usdc = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

  //Testnet
  const usdt = "0x1a551448eAF3b9d25DD818701b8689564386729C";     
  const usdc = "0xc3ABbD82cc5C69a14a101F839FEa178D1b3C193A ";

  const Payments = await hre.ethers.getContractFactory("Payments");
  const payments = await Payments.deploy(usdt, usdc);

  console.log(
    `Payment contract deployed to https://sepolia.etherscan.io/address/${await payments.getAddress()}`
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
