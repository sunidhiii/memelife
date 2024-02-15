import { Web3 } from "web3";
import dotenv from "dotenv";
import { contractAbi, contractAddress } from "./config/index.js";
dotenv.config();

var options = {
  timeout: 30000,
  clientConfig: {
    maxReceivedFrameSize: 100000000,
    maxReceivedMessageSize: 100000000,
  },
  reconnect: {
    auto: true,
    delay: 5000,
    maxAttempts: 15,
    onTimeout: false,
  },
};

const currentWeb3 = new Web3(
  new Web3.providers.HttpProvider(process.env.ETH_HTTPS)
);
const currentWeb3Socket = new Web3(
  new Web3.providers.WebsocketProvider(process.env.ETH_WEBSOCKET),
  options
);

const contractInstance = new currentWeb3.eth.Contract(
  contractAbi,
  contractAddress
);

const getPastWhiteListEvent = async () => {
  const startBlock = "19125945";
  const endBlock = "19125950";

  const getResult = await contractInstance.getPastEvents("Transfer", {
    fromBlock: 45735147,
    toBlock: "latest",
  });
  console.log("Total Events", getResult.length);
  for (let i = 0; i < getResult.length; i++) {
    const hash = `https://etherscan.io/tx/${getResult[i].transactionHash}`;
    const getTimestamp = await currentWeb3.eth.getBlock(
      getResult[i].blockNumber
    );
    const result = {
      eventName: "Transfer",
      // "account": getResult[i].returnValues.account,
      // "status": getResult[i].returnValues.status,
      transactionHash: hash,
      blockNumber: getResult[i].blockNumber,
      blockTimestamp: getTimestamp.timestamp,
    };
    console.log("result", result);
  }
};

const getWhiteListEvent = async () => {
  const eventTopics = {
    address: [contractAddress],
    topics: [currentWeb3.utils.sha3("TokensPaid(address,address,uint256)")],
  };

  const eventSubscribe = await currentWeb3Socket.eth.subscribe(
    "logs",
    eventTopics
  );
  eventSubscribe.on("error", (err) => {
    throw err;
  });
  eventSubscribe.on("connected", (nr) =>
    console.log("Subscription on Payments started with ID %s", nr)
  );
  eventSubscribe.on("data", (event) => {
    try {
      let user = currentWeb3.eth.abi.decodeParameters(
        ["address"],
        event.topics[1]
      );
      let currency = currentWeb3.eth.abi.decodeParameters(
        ["address"],
        event.topics[2]
      );
      let amount = currentWeb3.eth.abi.decodeParameters(["uint256"], event.data);

      const hash = `https://sepolia.etherscan.io/tx/${event.transactionHash}`;

      const result = {
        eventName: "TokensPaid",
        account: user[0],
        currency: currency[0],
        amount: amount[0],
        transactionHash: hash,
        blockNumber: event.blockNumber,
      };

      console.log("result", result);
    } catch (e) {
      console.log("error", e);
    }
  });
};

(async () => {
  await getWhiteListEvent();
  // await getPastWhiteListEvent();
})();
