import { Web3 } from "web3";
import { paymentsAbi, tokenAddress, paymentsAddress, tokenAbi } from "./config/index.js";

const web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.ETH_HTTPS)
);

const paymentsContract = new web3.eth.Contract(
  paymentsAbi,
  paymentsAddress
);

const tokenContract = new web3.eth.Contract(
  tokenAbi,
  tokenAddress
);

const getOwner = async (account) => {
  try {
    const owner = await contract.methods.owner(account).call();
    console.log(`${web3.utils.fromWei(owner)}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

// Example of using send() on a contract's method that requires gas
const buyWithEthFn = async (account, amount) => {
  try {
    const result = await paymentsContract.methods.buyWithEth().send({ from: account, value: amount });
    console.log(`Result: ${result.status}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

// Example of using send() on a contract's method that requires gas
const approveToken = async (account, amount) => {
  try {
    const result = await tokenContract.methods.approve(paymentsAddress, amount).send({ from: account });
    console.log(`Result: ${result.status}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

// Example of using send() on a contract's method that requires gas
const buyWithTokenFn = async (account, amount) => {
  try {
    const result = await paymentsContract.methods.buyWithToken(tokenAddress, amount).send({ from: account });
    console.log(`Result: ${result.status}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

// Example of using send() on a contract's method that requires gas
const withdrawEthFn = async (account) => {
  try {
    const result = await paymentsContract.methods.withdrawEth().send({ from: account });
    console.log(`Result: ${result.status}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

// Example of using send() on a contract's method that requires gas
const withdrawTokenFn = async (account) => {
  try {
    const result = await paymentsContract.methods.withdrawToken(tokenAddress).send({ from: account });
    console.log(`Result: ${result.status}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

(async () => {
  await getWhiteListEvent();
  // await getPastWhiteListEvent();
})();
