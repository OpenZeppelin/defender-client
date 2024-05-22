require('dotenv').config();

const { Relayer } = require('defender-relay-client');

async function main() {
  const relayer = new Relayer({ 
    apiKey: process.env.RELAYER_API_KEY, 
    apiSecret: process.env.RELAYER_API_SECRET,
    useCredentialsCaching: false,
  });

  const status = await relayer.getRelayer();

  console.log(status);
}

if (require.main === module) {
  main().catch(console.error);
}