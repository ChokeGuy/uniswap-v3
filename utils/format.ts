import { encodeSqrtRatioX96 } from '@uniswap/v3-sdk';
import { ethers } from 'hardhat';

function format(value: bigint) {
  return Number(ethers.formatEther(value));
}

function encodePriceSqrt(token1Price: number, token0Price: number) {
  return encodeSqrtRatioX96(token1Price, token0Price).toString();
}

export { encodePriceSqrt, format };
