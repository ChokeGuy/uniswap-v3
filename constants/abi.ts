import {
  abi as FACTORY_ABI,
  bytecode as FACTORY_BYTECODE,
} from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';
import {
  abi as NFT_MANAGER_ABI,
  bytecode as NFT_MANAGER_BYTE_CODE,
} from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json';
import {
  abi as SWAP_ROUTER_ABI,
  bytecode as SWAP_ROUTER_BYTE_CODE,
} from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json';
import {
  abi as NFT_DESCRIPTOR_ABI,
  bytecode as NFT_DESCRIPTOR_BYTE_CODE,
} from '@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json';

import { abi as NFT_POS_DESCRIPTOR_ABI } from '@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json';
import {
  abi as QUOTE_ABI,
  bytecode as QUOTE_BYTE_CODE,
} from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json';

import { abi as POOL_ABI } from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';

export {
  POOL_ABI,
  FACTORY_ABI,
  FACTORY_BYTECODE,
  NFT_MANAGER_ABI,
  NFT_MANAGER_BYTE_CODE,
  SWAP_ROUTER_ABI,
  SWAP_ROUTER_BYTE_CODE,
  NFT_POS_DESCRIPTOR_ABI,
  NFT_DESCRIPTOR_ABI,
  NFT_DESCRIPTOR_BYTE_CODE,
  QUOTE_ABI,
  QUOTE_BYTE_CODE,
};
