require('dotenv').config();

const { DefenderRelaySigner, DefenderRelayProvider } = require('@openzeppelin/defender-relay-client/lib/ethers');
const { ethers } = require('ethers');
const ERC20Abi = require('./erc20.json');
const ERC20Bytecode = require('./bytecode.json')[0].data.bytecode.object;
const ERC20Address = '0x6Ea25933e24320B38fED3a654a92948BECd28915';
const { domain, types, value } = require('./typedData.json');

async function main() {
  const creds = { apiKey: process.env.API_KEY, apiSecret: process.env.API_SECRET };

  const provider = new DefenderRelayProvider(creds);
  const validUntil = new Date(Date.now() + 120 * 1000).toISOString();
  const signer = new DefenderRelaySigner(creds, provider, { speed: 'fast', validUntil });

  const factory = new ethers.ContractFactory(ERC20Abi, ERC20Bytecode, signer);

  console.log(`Deploying ERC20 contract`);
  const erc20 = await factory.deploy(100, { gasLimit: 8000000 });
  console.log(`Contract deployed at address ${erc20.address}`);

  const beneficiary = await ethers.Wallet.createRandom().getAddress();

  const addr = await signer.getAddress();
  console.log(`Relayer address is ${addr}`);

  console.log(`Sending approve transaction for ${beneficiary} to token ${ERC20Address}...`);
  const tx = await erc20.approve(beneficiary, (1e17).toString(), { gasPrice: 1e8 });
  console.log(`Transaction sent:`, tx);

  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(`Replacing tx with higher gas price...`);
  const replaceTx = await erc20.approve(beneficiary, (1e17).toString(), { nonce: tx.nonce, gasPrice: 1e10 });
  console.log(`Transaction replaced:`, replaceTx);

  const mined = await replaceTx.wait();
  console.log(`Transaction mined:`, mined);

  const allowance = await erc20.allowance(replaceTx.from, beneficiary);
  console.log(`Allowance now is:`, allowance.toString());

  const sig = await signer.signMessage('0xdead');
  console.log(`Signature is ${sig}`);

  const sigAddress = ethers.utils.verifyMessage('Funds are safu!', sig);
  console.log(`Signature address is ${sigAddress} matching relayer address ${mined.from}`);

  const typedSig = await signer._signTypedData(domain, types, value);
  console.log(`Typed data signature is ${typedSig}`);

  const typedSigAddress = ethers.utils.verifyTypedData(domain, types, value, typedSig);
  console.log(`Typed data signature address is ${typedSigAddress} matching relayer address ${mined.from}`);
}

if (require.main === module) {
  main().catch(console.error);
}
