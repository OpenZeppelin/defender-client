require('dotenv').config();

const { Relayer } = require('@openzeppelin/defender-relay-client');

// Allows to invoke a relayer method using an access key, a secret, session token, and ARN.
// You have to provide these values to make it work. Keep in mind sessions expire in 900 seconds.
const credentials = {
  AccessKeyId: process.env.ACCESS_KEY,
  SecretAccessKey: process.env.SECRET_KEY,
  SessionToken: process.env.SESSION_TOKEN,
};

const relayer = new Relayer({
  credentials: JSON.stringify(credentials),
  relayerARN: process.env.ARN,
});

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
