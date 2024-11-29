import { ethers } from 'hardhat';
import { Percent } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
import { createPoolAndCompute } from '../apis/pool';
import { encodePriceSqrt, format } from '../utils/format';
import { addLiquidity, multiSwap, removeLiquidity, singleSwap } from '../apis';
import {
  POSITION_MANAGER_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  TOKEN1_ADDRESS,
  TOKEN2_ADDRESS,
  TOKEN3_ADDRESS,
} from '../constants/address';
import { getPositions } from '../utils';

async function main() {
  const [deployer] = await ethers.getSigners();
  const token1 = await ethers.getContractAt('MyToken', TOKEN1_ADDRESS);
  const token2 = await ethers.getContractAt('MyToken', TOKEN2_ADDRESS);
  const token3 = await ethers.getContractAt('MyToken', TOKEN3_ADDRESS);

  const token1Addr = await token1.getAddress();
  const token2Addr = await token2.getAddress();
  const token3Addr = await token3.getAddress();

  // (0.05, 0.3, 1, 0.01)
  const fee: FeeAmount = 0.3 * 10000;
  const price = encodePriceSqrt(1, 1);

  const token1Decimals = 18;
  const token2Decimals = 18;
  const token3Decimals = 18;

  const amount1 = ethers.parseEther('10000');
  const amount2 = ethers.parseEther('10000');
  const amount3 = ethers.parseEther('10000');

  const chainID = Number((await ethers.provider.getNetwork()).chainId);

  //Approve max amount for the position manager and the swap router
  await approve(
    ethers.MaxInt256,
    ethers.MaxInt256,
    token1Addr,
    token2Addr,
    POSITION_MANAGER_ADDRESS,
  );

  await approve(
    ethers.MaxInt256,
    ethers.MaxInt256,
    token2Addr,
    token3Addr,
    POSITION_MANAGER_ADDRESS,
  );

  await approve(
    ethers.MaxInt256,
    ethers.MaxInt256,
    token1Addr,
    token2Addr,
    SWAP_ROUTER_ADDRESS,
  );

  await approve(
    ethers.MaxInt256,
    ethers.MaxInt256,
    token2Addr,
    token3Addr,
    SWAP_ROUTER_ADDRESS,
  );

  const {
    configuredPool: pool1,
    position: pos1,
    Token1: Token1,
    Token2: Token2F,
  } = await createPoolAndCompute(
    token1Addr,
    token2Addr,
    amount1,
    amount2,
    fee,
    price,
    chainID,
    token1Decimals,
    token2Decimals,
  );

  const {
    configuredPool: pool2,
    position: pos2,
    Token1: Token3,
    Token2: Token2S,
  } = await createPoolAndCompute(
    token3Addr,
    token2Addr,
    amount2,
    amount3,
    fee,
    price,
    chainID,
    token2Decimals,
    token3Decimals,
  );

  await addLiquidity(deployer, pos1);
  await addLiquidity(deployer, pos2);

  // await removeLiquidity(
  //   deployer,
  //   pos1,
  //   2,
  //   Token1,
  //   Token2F,
  //   new Percent(50, 100),
  // );

  // await removeLiquidity(
  //   deployer,
  //   pos2,
  //   1,
  //   Token3,
  //   Token2S,
  //   new Percent(50, 100),
  // );

  console.log(
    `Token1 before swap: ${format(await token1.balanceOf(deployer.address))}`,
  );
  console.log(
    `Token2  before swap: ${format(await token2.balanceOf(deployer.address))}`,
  );

  console.log(
    `Token3  before swap: ${format(await token3.balanceOf(deployer.address))}`,
  );

  // await singleSwap(
  //   pool1,
  //   deployer,
  //   Token1,
  //   Token2F,
  //   1,
  //   new Percent(50, 10_000),
  //   Math.floor(Date.now() / 1000) + 60 * 20,
  // );

  await multiSwap(
    deployer,
    [TOKEN1_ADDRESS, TOKEN2_ADDRESS, TOKEN3_ADDRESS],
    [fee, fee],
    Math.floor(Date.now() / 1000) + 60 * 20,
    1,
    0,
  );

  console.log(
    `Token1 after swap: ${format(await token1.balanceOf(deployer.address))}`,
  );
  console.log(
    `Token2  after swap: ${format(await token2.balanceOf(deployer.address))}`,
  );
  console.log(
    `Token3  after swap: ${format(await token3.balanceOf(deployer.address))}`,
  );
}

async function approve(
  amount0: bigint | number,
  amount1: bigint | number,
  token0Addr: string,
  token1Addr: string,
  approveAddr: string,
) {
  const [deployer] = await ethers.getSigners();
  const token0 = await ethers.getContractAt('MyToken', token0Addr, deployer);
  const token1 = await ethers.getContractAt('MyToken', token1Addr, deployer);

  await token0.approve(approveAddr, amount0);

  await token1.approve(approveAddr, amount1);
}

main().catch(console.error);
