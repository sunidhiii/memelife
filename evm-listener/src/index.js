import web3 from "web3";
import dotenv from 'dotenv';
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

const currentWeb3 = new web3(new web3.providers.HttpProvider(process.env.MUMBAI_HTTP));
const currentWeb3Socket = new web3(new web3.providers.WebsocketProvider(process.env.MUMBAI_WEBSOCKET,options));

const contractInstance = new currentWeb3.eth.Contract(contractAbi,contractAddress);

const getPastWhiteListEvent = async() => {
    const startBlock = "19125945";
    const endBlock = "19125950";
    
    const getResult = await contractInstance.getPastEvents(
        'Transfer',
        {
            fromBlock: startBlock,
            toBlock: endBlock,
        }
    );
    console.log("Total Events", getResult.length);
    for(let i=0;i<getResult.length;i++) {
        const hash = `https://etherscan.io/tx/${getResult[i].transactionHash}`;
        const getTimestamp = await currentWeb3.eth.getBlock(getResult[i].blockNumber);
        const result = {
            "eventName": "Transfer",
            // "account": getResult[i].returnValues.account,
            // "status": getResult[i].returnValues.status,
            "transactionHash": hash,
            "blockNumber": getResult[i].blockNumber,
            "blockTimestamp":getTimestamp.timestamp
        }
        console.log("result", result);
    }
}
const getWhiteListEvent = async() => {
    const eventTopics = {
        address: [contractAddress],
        topics: [
            currentWeb3.utils.sha3('Transfer(address,address,uint256)')
        ]
    }

    const eventSubscribe = currentWeb3Socket.eth.subscribe('logs', eventTopics);
    eventSubscribe.on('data',async event => {
        try {
            let decodedValue = currentWeb3.eth.abi.decodeLog(
                [{type:'address', name:'from', indexed: true},{type:'address', name:'to', indexed: true},{type:'uint256', name:'amount'}],
            event.data, [event.topics[1]]);

            const hash = `https://etherscan.io/tx/${event.transactionHash}`
            const getTimestamp = await currentWeb3.eth.getBlock(event.blockNumber);

            const result = {
                "eventName": "Transfer",
                "account": decodedValue.account,
                "status": decodedValue.status,
                "transactionHash": hash,
                "blockNumber": event.blockNumber,
                "blockTimestamp":getTimestamp.timestamp
            }

            console.log("result", result);
        } catch (e){
            console.log("error", e);
        }
    })    
}


(async() => {
    // await getWhiteListEvent();
    await getPastWhiteListEvent();
})();