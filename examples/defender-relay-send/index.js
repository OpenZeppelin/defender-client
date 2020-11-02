require('dotenv').config();

const { Relayer } = require('defender-relay-client');

const params = { apiKey: process.env.API_KEY, apiSecret: process.env.API_SECRET };
const relayer = new Relayer(params);

async function get() {
  const info = await relayer.getRelayer();
  console.log('Relayer info', info);
}

async function send() {
  const txResponse = await relayer.sendTransaction({
    to: '0x179810822f56b0e79469189741a3fa5f2f9a7631',
    value: 1,
    speed: 'fast',
    gasLimit: '21000',
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
      await get();
      await send();
      await sign('0xdead');
    }
  } catch (e) {
    console.log(e);
  }
})();
