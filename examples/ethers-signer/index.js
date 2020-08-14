require('dotenv').config();

const { DefenderRelaySigner } = require('defender-relay-client/lib/ethers');
const { ethers } = require('ethers');
const ERC20Abi = require('./erc20.json');
const ERC20Address = '0x6Ea25933e24320B38fED3a654a92948BECd28915';

async function main() {
  const provider = ethers.getDefaultProvider('rinkeby');
  const signer = new DefenderRelaySigner(process.env.RELAYER_API_KEY, process.env.RELAYER_API_SECRET, provider, {
    from: '0x387b06760c45dc01edbb202d54f8624440c6e025',
    speed: 'fast',
  });
  const erc20 = new ethers.Contract(ERC20Address, ERC20Abi, signer);
  const beneficiary = await ethers.Wallet.createRandom().getAddress();

  console.log(`Sending approve transaction for ${beneficiary} to token ${ERC20Address}...`);
  const tx = await erc20.functions.approve(beneficiary, (1e18).toString());
  console.log(`Transaction sent:`, tx);

  const mined = await tx.wait();
  console.log(`Transaction mined:`, mined);

  const allowance = await erc20.functions.allowance(tx.from, beneficiary);
  console.log(`Allowance now is:`, allowance.toString());
}

if (require.main === module) {
  main().catch(console.error);
}
