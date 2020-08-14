require('dotenv').config();

const { Relayer } = require('defender-relay-client');

const relayer = new Api();

async function main() {
  const txResponse = await relayer.sendTransaction({
    to: '0xc7dd3ff5b387db0130854fe5f141a78586f417c6',
    value: 100,
    speed: 'fast',
    gasLimit: '1000000',
  });
  console.log('txResponse', txResponse);
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.log(e);
  }
})();
