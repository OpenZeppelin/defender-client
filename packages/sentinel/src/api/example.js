require('dotenv').config();

const { SentinelClient, CreateSentinelRequest } = require('defender-sentinel-client');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new SentinelClient(creds);

  console.log("Client:", client);

  const listResponse = await client.list()
  console.log("Sentinel List:", listResponse);


  const request: CreateSentinelRequest = {
    blockWatcherId: 'rinkeby-1',
    name: 'Test1234',
    paused: false,
    addressRules: [],
  }

  // const createResponse = await client.create(request)

  // console.log("Create Response:", createResponse)

  // const listResponse2 = await client.list()
  // console.log("Sentinel List AFTER CREATE:", listResponse2);

  // const updateResponse = await client.update("8181d9e0-88ce-4db0-802a-2b56e2e6a7b1", request)
  // console.log("Sentinel Updated:", updateResponse);

  // const pauseResponse = await client.pause("8181d9e0-88ce-4db0-802a-2b56e2e6a7b1")
  // console.log("Sentinel Paused:", pauseResponse);

  // const unpauseResponse = await client.unpause("8181d9e0-88ce-4db0-802a-2b56e2e6a7b1")
  // console.log("Sentinel Unpaused:", unpauseResponse);


  const getResponse = await client.get("8181d9e0-88ce-4db0-802a-2b56e2e6a7b1")
  console.log("Sentinel:", getResponse);

  const deleteResponse = await client.delete("8181d9e0-88ce-4db0-802a-2b56e2e6a7b1")
  console.log("Sentinel Deleted:", deleteResponse);

  console.log("Sentinel List:", await client.list());
}

if (require.main === module) {
  main().catch(console.error);
}