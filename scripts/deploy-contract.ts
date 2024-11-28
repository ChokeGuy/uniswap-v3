import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import fs from 'fs';
import { promisify } from 'util';

import WETH9 from '../WETH9.json';
import {
  FACTORY_ABI,
  FACTORY_BYTECODE,
  QUOTE_ABI,
  QUOTE_BYTE_CODE,
  SWAP_ROUTER_ABI,
  SWAP_ROUTER_BYTE_CODE,
  NFT_DESCRIPTOR_ABI,
  NFT_DESCRIPTOR_BYTE_CODE,
  NFT_MANAGER_ABI,
  NFT_MANAGER_BYTE_CODE,
  NFT_POS_DESCRIPTOR_ABI,
} from '../constants/abi';

const linkLibraries = (
  {
    bytecode,
    linkReferences,
  }: {
    bytecode: any;
    linkReferences: any;
  },
  libraries: any,
) => {
  Object.keys(linkReferences).forEach((fileName) => {
    Object.keys(linkReferences[fileName]).forEach((contractName) => {
      if (!libraries.hasOwnProperty(contractName)) {
        throw new Error(`Missing link library name ${contractName}`);
      }
      const address = ethers
        .getAddress(libraries[contractName])
        .toLowerCase()
        .slice(2);
      linkReferences[fileName][contractName].forEach(
        ({ start, length }: { start: number; length: number }) => {
          const start2 = 2 + start * 2;
          const length2 = length * 2;
          bytecode = bytecode
            .slice(0, start2)
            .concat(address)
            .concat(bytecode.slice(start2 + length2, bytecode.length));
        },
      );
    });
  });
  return bytecode;
};

async function main() {
  // Get the deployer's signer (this is the account that will deploy the contract)
  const [deployer] = await ethers.getSigners();

  const tokenAddr = await createToken(deployer);

  const factoryAddr = await createFactory(deployer);

  const quoteAddr = await createQuote(factoryAddr, tokenAddr, deployer);

  const swapRouterAddr = await createSwapRouter(
    factoryAddr,
    tokenAddr,
    deployer,
  );

  const nftPosAddr = await createNFTPosDescriptor(tokenAddr, deployer);

  const nftPosManagerAddr = await createNFTPosManager(
    factoryAddr,
    tokenAddr,
    nftPosAddr,
    deployer,
  );

  let addresses = [
    `FACTORY_ADDRESS="${factoryAddr}"`,
    `POSITION_MANAGER_ADDRESS="${nftPosManagerAddr}"`,
    `QUOTE_ADDRESS="${quoteAddr}"`,
    `SWAP_ROUTER_ADDRESS="${swapRouterAddr}"`,
  ];
  const data = '\n' + addresses.join('\n');

  const writeFile = promisify(fs.appendFile);
  const filePath = '.env';
  return writeFile(filePath, data)
    .then(() => {
      console.log(
        'Factory + NFT Position Manager + Quote + Swap Router Addresses added to .env',
      );
    })
    .catch((error: unknown) => {
      console.error('Error logging addresses:', error);
      throw error;
    });
}

async function createToken(deployer: Signer) {
  const Token = await ethers.getContractFactory(
    WETH9.abi,
    WETH9.bytecode,
    deployer,
  );
  const token = await Token.deploy();
  const tokenAddr = await token.getAddress();
  return tokenAddr;
}

async function createFactory(deployer: Signer) {
  // Create the contract factory for the Uniswap V3 Factory
  const Factory: any = new ethers.ContractFactory(
    FACTORY_ABI,
    FACTORY_BYTECODE,
    deployer,
  );

  // Deploy the contract
  const factory = await Factory.deploy();

  await factory.waitForDeployment();

  const addr = await factory.getAddress();
  return addr;
}

async function createQuote(
  factoryAddr: string,
  tokenAddr: string,
  deployer: Signer,
) {
  // Create the contract quote for the Uniswap V3 Quote
  const Quote: any = await ethers.getContractFactory(
    QUOTE_ABI,
    QUOTE_BYTE_CODE,
    deployer,
  );

  // Deploy the contract
  const quote = await Quote.deploy(factoryAddr, tokenAddr);

  await quote.waitForDeployment();

  const addr = await quote.getAddress();
  return addr;
}

async function createSwapRouter(
  factoryAddr: string,
  tokenAddr: string,
  deployer: Signer,
) {
  const SwapRouter = await ethers.getContractFactory(
    SWAP_ROUTER_ABI,
    SWAP_ROUTER_BYTE_CODE,
    deployer,
  );
  const swapRouter = await SwapRouter.deploy(factoryAddr, tokenAddr);
  const addr = await swapRouter.getAddress();

  return addr;
}

async function createNFTPosDescriptor(tokenAddr: string, deployer: Signer) {
  const NFTDescriptor = await ethers.getContractFactory(
    NFT_DESCRIPTOR_ABI,
    NFT_DESCRIPTOR_BYTE_CODE,
    deployer,
  );
  const nftDescriptor = await NFTDescriptor.deploy();
  const nftDesAddr = await nftDescriptor.getAddress();

  const linkedBytecode = linkLibraries(
    {
      bytecode: NFT_DESCRIPTOR_BYTE_CODE,
      linkReferences: {
        'NFTDescriptor.sol': {
          NFTDescriptor: [
            {
              length: 20,
              start: 1681,
            },
          ],
        },
      },
    },
    {
      NFTDescriptor: nftDesAddr,
    },
  );

  const NFTPosDescriptor = await ethers.getContractFactory(
    NFT_POS_DESCRIPTOR_ABI,
    linkedBytecode,
    deployer,
  );

  const nativeCurrencyLabelBytes = ethers.encodeBytes32String('MT');
  const nftPosDescriptor = await NFTPosDescriptor.deploy(
    tokenAddr,
    nativeCurrencyLabelBytes,
  );
  const nftPosAddr = await nftPosDescriptor.getAddress();

  return nftPosAddr;
}

async function createNFTPosManager(
  factoryAddr: string,
  tokenAddr: string,
  nftPosDescAddr: string,
  deployer: Signer,
) {
  const NFTPosManager = await ethers.getContractFactory(
    NFT_MANAGER_ABI,
    NFT_MANAGER_BYTE_CODE,
    deployer,
  );
  const nftPosManager = await NFTPosManager.deploy(
    factoryAddr,
    tokenAddr,
    nftPosDescAddr,
  );

  const nftPosManagerAddr = await nftPosManager.getAddress();

  return nftPosManagerAddr;
}

/*
  npx hardhat run --network localhost scripts/deploy-contract.ts
*/
main().catch(console.error);
