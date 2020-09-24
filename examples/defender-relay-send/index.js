require('dotenv').config();

const { Relayer } = require('defender-relay-client');

const params = { apiKey: process.env.API_KEY, apiSecret: process.env.API_SECRET };
const relayer = new Relayer(params);

async function send() {
  const txResponse = await relayer.sendTransaction({
    to: '0xc7dd3ff5b387db0130854fe5f141a78586f417c6',
    value: 100,
    speed: 'fast',
    gasLimit: '24000',
  });
  console.log('txResponse', txResponse);
}

async function sign(msg) {
  const signResponse = await relayer.sign({ message: msg });
  console.log('signResponse', signResponse);
}

async function query(id) {
  const txUpdate = await relayer.query(id);
  console.log('txUpdate', txUpdate);
}

(async () => {
  try {
    if (process.argv.length > 2) {
      await query(process.argv[2]);
    } else {
      await send();
      await sign('0xdead');
    }
  } catch (e) {
    console.log(e);
  }
})();
