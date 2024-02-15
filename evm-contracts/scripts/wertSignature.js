const EdDSA = require('elliptic').eddsa;
const ellipticEdDSA = new EdDSA('ed25519');
const ellipticKey = ellipticEdDSA.keyFromSecret(`${private_key}`); 
// Your private key should be passed here without the 0x prefix.

const data = {
  address: '0x3432a9F32E873512c83e9C390E28bA6a98071C01',
  commodity: 'ETH',
  network: 'ethereum',
  commodity_amount: 0.3,
  sc_address: '0x0a180A76e4466bF68A7F86fB029BEd3cCcFaAac5',
  sc_input_data:
    '0x40c10f1900000000000000000000000085f584812fc19c69e4dd586f06df93aa7bdadd4d000000000000000000000000000000000000000000000000016345785d8a0000',
};

const dataString = Object.keys(data)
  .sort()
  .map(key => `${key}:${data[key]}`)
  .join('\n');

const hash = Buffer.from(dataString, 'utf8').toString('hex');
const signature = ellipticKey.sign(hash).toHex();


const wertWidget = new WertWidget({
  signature: signature,
  ...otherWidgetOptions,
});