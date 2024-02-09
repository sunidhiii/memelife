const { Connection, PublicKey } = require("@solana/web3.js");
const searchAddress = "ALkXoJ7daxtcE7sauzg8NVpwKQ8q8aE7AdoyMzX9FTTY";
// const endPoint = process.env.END_POINT;
const solanaConnection = new Connection("https://api.devnet.solana.com");
const getTransactions = async(address, numTx) => {
    const pubKey = new PublicKey(address);
    let transactionList = await solanaConnection.getSignaturesForAddress(pubKey, {limit:numTx});
    transactionList.forEach((transaction, i) => {
        const date = new Date(transaction.blockTime*1000);
        console.log(`Transaction No: ${i+1}`);
        console.log(`Signature: ${transaction.signature}`);
        console.log(`Time: ${date}`);
        console.log(`Status: ${transaction.confirmationStatus}`);
        console.log(("-").repeat(20));
    })
}
const getTransactions_logs = async() => {
  let transaction = await solanaConnection.onAccountChange(new PublicKey("9qAFHpSVmi2sKCYcJt9mvAzzfjCCbF1YczSirsh3BooT"),
    (updatedAccountInfo, context) => console.log("Updated account info: ", updatedAccountInfo),
    "confirmed"
  );
}
getTransactions_logs()
getTransactions(searchAddress,5)