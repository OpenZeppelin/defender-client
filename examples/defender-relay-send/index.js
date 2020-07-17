require('dotenv').config();

const { Relayer } = require('@openzeppelin/defender-client');

const relayer = new Relayer(
  '6u9s2HRkkM86i8vcibfXRhA5Ag3k3MpZ',
  '5EwMnhwMiWCPkND5QQX6BDz361Jnhb4tNaWQovM4nHZNVakcQzHzjo66f3CCgVzJ',
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
