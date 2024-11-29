import { ethers } from 'hardhat';
import { promisify } from 'util';
import fs from 'fs';

async function main() {
  const [owner] = await ethers.getSigners();

  const TOKEN1 = await ethers.getContractFactory('MyToken', owner);
  const token1 = await TOKEN1.deploy();

  const TOKEN2 = await ethers.getContractFactory('MyToken', owner);
  const token2 = await TOKEN2.deploy();

  const TOKEN3 = await ethers.getContractFactory('MyToken', owner);
  const token3 = await TOKEN3.deploy();

  await token1.connect(owner).mint(owner.address, ethers.parseEther('100000'));
  await token2.connect(owner).mint(owner.address, ethers.parseEther('100000'));
  await token3.connect(owner).mint(owner.address, ethers.parseEther('100000'));

  const token1Addr = await token1.getAddress();
  const token2Addr = await token2.getAddress();
  const token3Addr = await token3.getAddress();

  let addresses = [
    `TOKEN1_ADDRESS="${token1Addr}"`,
    `TOKEN2_ADDRESS="${token2Addr}"`,
    `TOKEN3_ADDRESS="${token3Addr}"`,
  ];
  const data = '\n' + addresses.join('\n');

  const writeFile = promisify(fs.appendFile);
  const filePath = '.env';
  return writeFile(filePath, data)
    .then(() => {
      console.log('Token Addresses added to .env');
    })
    .catch((error: unknown) => {
      console.error('Error logging addresses:', error);
      throw error;
    });
}

main().catch(console.error);
