require('dotenv').config();

const { Relayer } = require('defender-relay-client');

const relayer = new Relayer(
  process.env.RELAYER_API_KEY,
  process.env.RELAYER_API_SECRET,
);

async function send() {
  const txResponse = await relayer.sendTransaction({
    to: '0xc7dd3ff5b387db0130854fe5f141a78586f417c6',
    value: 100,
    speed: 'fast',
    gasLimit: '1000000',
  });
  console.log('txResponse', txResponse);
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
    }
  } catch (e) {
    console.log(e);
  }
})();
