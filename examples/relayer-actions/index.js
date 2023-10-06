require('dotenv').config();

const { Relayer, VERSION } = require('@openzeppelin/defender-relay-client');

const params = { apiKey: process.env.API_KEY, apiSecret: process.env.API_SECRET };
const relayer = new Relayer(params);

async function get() {
  const info = await relayer.getRelayer();
  console.log('relayerInfo', JSON.stringify(info, null, 2));
}

async function status() {
  const info = await relayer.getRelayerStatus();
  console.log('relayerStatus', JSON.stringify(info, null, 2));
}

async function send() {
  const txResponse = await relayer.sendTransaction({
    to: '0x179810822f56b0e79469189741a3fa5f2f9a7631',
    value: 1,
    speed: 'fast',
    gasLimit: '21000',
  });
  console.log('txResponse', JSON.stringify(txResponse, null, 2));
}

async function replace(id) {
  const txResponse = await relayer.replaceTransactionById(id, {
    to: '0x179810822f56b0e79469189741a3fa5f2f9a7631',
    value: 2,
    speed: 'fast',
    gasLimit: '21000',
  });
  console.log('txResponse', JSON.stringify(txResponse, null, 2));
}

async function sign(msg) {
  if (!msg) throw new Error(`Missing msg to sign`);
  const signResponse = await relayer.sign({ message: msg });
  console.log('signResponse', signResponse);
}

async function query(id) {
  if (!id) throw new Error(`Missing id`);
  const txUpdate = await relayer.query(id);
  console.log('txUpdate', txUpdate);
}

async function list() {
  const list = await relayer.list({ limit: 3 });
  console.log(list.map((tx) => JSON.stringify(tx, null, 2)).join('\n'));
}

async function balance(addr) {
  if (!addr) throw new Error(`Missing address`);
  const balance = await relayer.call('eth_getBalance', [addr, 'latest']);
  console.log(`eth_getBalance`, JSON.stringify(balance, null, 2));
}

async function jsonrpc(method, payload) {
  if (!method) throw new Error(`Missing method`);
  if (!payload) throw new Error(`Missing payload`);
  const result = await relayer.call(method, JSON.parse(payload));
  console.log(method, JSON.stringify(result, null, 2));
}

(async () => {
  try {
    const action = process.argv[2];
    if (!action) {
      console.error(`Usage: node index.js query|get|status|send|sign|balance`);
      process.exit(1);
    }
    console.log(`Using client version`, VERSION);
    switch (action) {
      case 'query':
        return await query(process.argv[3]);
      case 'get':
        return await get();
      case 'status':
        return await status();
      case 'send':
        return await send();
      case 'replace':
        return await replace(process.argv[3]);
      case 'sign':
        return await sign(process.argv[3]);
      case 'balance':
        return await balance(process.argv[3]);
      case 'list':
        return await list();
      case 'jsonrpc':
        return await jsonrpc(process.argv[3], process.argv[4]);
      default:
        console.error(`Unknown action ${process.argv[2]}`);
        process.exit(1);
    }
  } catch (e) {
    console.log(`Unexpected error:`, e);
    process.exit(1);
  }
})();
