import { ethers } from 'hardhat';
import { Token } from '@uniswap/sdk-core';
import {
  computePoolAddress,
  FeeAmount,
  nearestUsableTick,
  Pool,
  Position,
} from '@uniswap/v3-sdk';
import { NFT_MANAGER_ABI, POOL_ABI } from '../constants/abi';
import {
  FACTORY_ADDRESS,
  POSITION_MANAGER_ADDRESS,
} from '../constants/address';

async function getContract(address: string, abi: any) {
  const [deployer] = await ethers.getSigners();
  const contract = new ethers.Contract(address, abi, deployer);
  return contract;
}

async function getPoolState(poolContract: any) {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  return {
    tickSpacing: Number(tickSpacing),
    fee: Number(fee),
    liquidity: liquidity.toString(),
    sqrtPriceX96: slot0[0].toString(),
    tick: Number(slot0[1]),
  };
}

async function createPoolAndCompute(
  token1Addr: string,
  token2Addr: string,
  amount0: bigint | number,
  amount1: bigint | number,
  fee: FeeAmount,
  price: any,
  chainId: number,
  token1Decimals: number,
  token2Decimals: number,
) {
  const [deployer] = await ethers.getSigners();

  const nftPosManagerContract: any = await getContract(
    POSITION_MANAGER_ADDRESS,
    NFT_MANAGER_ABI,
  );

  await nftPosManagerContract
    .connect(deployer)
    .createAndInitializePoolIfNecessary(token1Addr, token2Addr, fee, price);

  const Token1 = new Token(
    chainId,
    token1Addr,
    token1Decimals,
    'MyToken',
    'MT',
  );

  const Token2 = new Token(
    chainId,
    token2Addr,
    token2Decimals,
    'MyToken',
    'MT',
  );

  const poolAddr = computePoolAddress({
    factoryAddress: FACTORY_ADDRESS,
    tokenA: Token1,
    tokenB: Token2,
    fee,
  });
  const poolContract = new ethers.Contract(poolAddr, POOL_ABI, deployer);

  const state = await getPoolState(poolContract);

  const configuredPool = new Pool(
    Token1,
    Token2,
    state.fee,
    state.sqrtPriceX96,
    state.liquidity,
    state.tick,
  );

  const position = Position.fromAmounts({
    pool: configuredPool,
    tickLower:
      nearestUsableTick(
        configuredPool.tickCurrent,
        configuredPool.tickSpacing,
      ) - configuredPool.tickSpacing,
    tickUpper:
      nearestUsableTick(
        configuredPool.tickCurrent,
        configuredPool.tickSpacing,
      ) + configuredPool.tickSpacing,
    amount0: amount0.toString(),
    amount1: amount1.toString(),
    useFullPrecision: false,
  });
  return { configuredPool, position, Token1, Token2 };
}

export { createPoolAndCompute, getContract, getPoolState };
