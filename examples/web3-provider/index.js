require('dotenv').config();

const { DefenderRelayProvider, DefenderRelaySenderProvider } = require('defender-relay-client/lib/web3');
const Web3 = require('web3');
const ERC20Abi = require('./erc20.json');
const ERC20Bytecode = require('./bytecode.json')[0].data.bytecode.object;
const Beneficiary = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';

async function main(provider) {
  const web3 = new Web3(provider)  
  const [from] = await web3.eth.getAccounts();
  const balance = await web3.eth.getBalance(from);
  console.log(`Relayer address is ${from} with balance ${balance}`);
  
  console.log(`Deploying ERC20 contract`);
  const factory = new web3.eth.Contract(ERC20Abi, null, { data: ERC20Bytecode, from });
  const erc20 = await factory.deploy({ arguments: [100] }).send();
  console.log(`Contract deployed at address ${erc20.options.address}`);

  erc20.events.Transfer().on('data', (evt) => {
    console.log(`Received Transfer event from erc20`);
  });

  console.log(`Sending approve transaction for ${Beneficiary} to token ${erc20.options.address}...`);
  const tx = await erc20.methods.approve(Beneficiary, (1e17).toString()).send();
  console.log(`Transaction sent:`, tx);

  const allowance = await erc20.methods.allowance(tx.from, Beneficiary).call();
  console.log(`Allowance now is:`, allowance.toString());

  const sig = await web3.eth.sign('0xdead', from);
  console.log(`Signature is ${sig}`);
}

function defenderProvider(creds) {
  const validUntil = new Date(Date.now() + 120 * 1000).toISOString();
  return new DefenderRelayProvider(creds, { speed: 'fast', validUntil });
}

if (require.main === module) {
  const creds = { apiKey: process.env.API_KEY, apiSecret: process.env.API_SECRET };
  const provider = defenderProvider(creds);
  main(provider).catch(console.error);
}
