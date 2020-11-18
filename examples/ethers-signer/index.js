require('dotenv').config();

const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');
const { ethers } = require('ethers');
const ERC20Abi = require('./erc20.json');
const ERC20Address = '0x6Ea25933e24320B38fED3a654a92948BECd28915';

async function main() {
  const creds = { apiKey: process.env.API_KEY, apiSecret: process.env.API_SECRET };
  
  const provider = new DefenderRelayProvider(creds);
  const signer = new DefenderRelaySigner(creds, provider, { speed: 'fast' });

  const erc20 = new ethers.Contract(ERC20Address, ERC20Abi, signer);
  const beneficiary = await ethers.Wallet.createRandom().getAddress();

  const addr = await signer.getAddress();
  console.log(`Relayer address is ${addr}`);

  console.log(`Sending approve transaction for ${beneficiary} to token ${ERC20Address}...`);
  const tx = await erc20.approve(beneficiary, (1e18).toString());
  console.log(`Transaction sent:`, tx);

  const mined = await tx.wait();
  console.log(`Transaction mined:`, mined);

  const allowance = await erc20.allowance(tx.from, beneficiary);
  console.log(`Allowance now is:`, allowance.toString());

  const sig = await signer.signMessage('0xdead');
  console.log(`Signature is ${sig}`);

  const sigAddress = await ethers.utils.verifyMessage('Funds are safu!', sig);
  console.log(`Signature address is ${sigAddress}, should be the same as relayer address ${mined.from}`);
}

if (require.main === module) {
  main().catch(console.error);
}
