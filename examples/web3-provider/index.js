require('dotenv').config();

const { DefenderRelayProvider } = require('defender-relay-client/lib/web3');
const Web3 = require('web3');
const ERC20Abi = require('./erc20.json');
const ERC20Bytecode = require('./bytecode.json')[0].data.bytecode.object;
const Beneficiary = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';

async function main() {
  const creds = { apiKey: process.env.API_KEY, apiSecret: process.env.API_SECRET };

  const validUntil = new Date(Date.now() + 120 * 1000).toISOString();
  const provider = new DefenderRelayProvider(creds, { speed: 'fast', validUntil });  
  const web3 = new Web3(provider)
  
  const [from] = await web3.eth.getAccounts();
  console.log(`Relayer address is ${from}`);

  console.log(`Deploying ERC20 contract`);
  const factory = new web3.eth.Contract(ERC20Abi, undefined, { data: ERC20Bytecode, from });
  const erc20 = await factory.deploy({ arguments: [100] }).send();
  console.log(`Contract deployed at address ${erc20.options.address}`);

  console.log(`Sending approve transaction for ${Beneficiary} to token ${erc20.options.address}...`);
  const tx = await erc20.methods.approve(Beneficiary, (1e17).toString()).send();
  console.log(`Transaction sent:`, tx);

  const allowance = await erc20.methods.allowance(tx.from, Beneficiary).call();
  console.log(`Allowance now is:`, allowance.toString());

  const sig = await web3.eth.sign('0xdead', from);
  console.log(`Signature is ${sig}`);
}

if (require.main === module) {
  main().catch(console.error);
}
