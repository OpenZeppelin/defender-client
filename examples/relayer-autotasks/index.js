require('dotenv').config();

const { Relayer } = require('defender-relay-client');

// Allows to invoke a relayer method using an access key, a secret, session token, and ARN.
// You have to provide these values to make it work. Keep in mind sessions expire in 900 seconds.
const credentials = {
  AccessKeyId: 'ASIAYW4YUAGWIBQMSPX4',
  SecretAccessKey: 'r2tpQDulrZqOopXW17aNHT+FNdPzVhuT0z9Wf3Qu',
  SessionToken:
    'FwoGZXIvYXdzEOL//////////wEaDOjNFLuhOckwXF/DQyLuArBprNwsCpRm9JB9kMCQcRgGlapmd3nq862uq7/sKerKG0DgBi1u4FXr85GRiz91P0CP0ZUspbWmqDd4r1JpJo4StnHUPTP54yJqo4BNxw0qXqtgByX1EeFJaCSQt9csbLqab2Xqqbwizwr4m1yBuhUllVuPPLdxqY4HKtRMZGObQlFb0MLllH1z6j89/lTtj5jxqvA1NwtjgBgn5IenkA6VOsyDR2xZzL70zyUXWB53pkoGPTMA2RYcapIk3f2HgehLrUSJikk69aY0LxHEqWXEbRQqWUwnr8hILqT/+S6UHhhyL0KpAFtyfZSP6v1F+iQx0R0zBNVPpc9QLV152EGpHh6qIyDPyOAjAO4LykmfaD79IKaWBa703exd6Us07zyEkys9vGUlSp3K7ynGyqWbsPNzvvU4/7OhS9yiysshI2HfcQuAt1ageMo/w1sfNkeJGSoYNU9O7z8xhDgW70dDRxP5N57pwYJqRkjOCyjNnZP6BTIt/Vi154CPGPQwKa9xK47eBi4MjDGh2Ar/KtMjXNlQSxdnfR+4gKlLiD0rsqIC',
};

const arn = '';

const relayer = new Relayer({
  credentials: JSON.stringify(credentials),
  relayerARN: arn,
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
