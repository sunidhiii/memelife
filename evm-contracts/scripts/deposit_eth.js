const hre = require("hardhat");

async function main() {

  const payments_address = "0x85AEF8d273809bD573edc03ce497c0580F99d0E9";     
  let userAddress = "HrvDUrVTeg5AL7vRMkkvqZGdYgYgBsBBwopr42nZQRca";

  // const payments = await (await ethers.getContractFactory("Payments")).attach(payments_address)
  const payments = await hre.ethers.getContractAt("Payments", payments_address);

  const depositEth = await payments.buyWithEth(userAddress, { value: ethers.parseEther("0.0001") });

  console.log("Tx hash:", depositEth.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
