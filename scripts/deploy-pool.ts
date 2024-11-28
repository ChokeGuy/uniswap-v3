import { ethers } from 'hardhat';
import { FeeAmount } from '@uniswap/v3-sdk';
import { createPoolAndCompute } from '../apis/pool';
import { encodePriceSqrt, format } from '../utils/format';
import { addLiquidity, removeLiquidity, swap } from '../apis';
import {
  POSITION_MANAGER_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  TOKEN1_ADDRESS,
  TOKEN2_ADDRESS,
} from '../constants/address';
import { getPositions } from '../utils';

async function main() {
  const [deployer] = await ethers.getSigners();
  const token1 = await ethers.getContractAt('MyToken', TOKEN1_ADDRESS);
  const token2 = await ethers.getContractAt('MyToken', TOKEN2_ADDRESS);

  const token1Addr = await token1.getAddress();
  const token2Addr = await token2.getAddress();

  // (0.05, 0.3, 1, 0.01)
  const fee: FeeAmount = 0.3 * 10000;
  const price = encodePriceSqrt(1, 1);

  const token1Decimals = 18;
  const token2Decimals = 18;

  const amount0 = ethers.parseEther('10000');
  const amount1 = ethers.parseEther('10000');

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
    token1Addr,
    token2Addr,
    SWAP_ROUTER_ADDRESS,
  );

  const { configuredPool, position, Token1, Token2 } =
    await createPoolAndCompute(
      token1Addr,
      token2Addr,
      amount0,
      amount1,
      fee,
      price,
      chainID,
      token1Decimals,
      token2Decimals,
    );

  // console.log(await getPositions(deployer.address));

  // await addLiquidity(deployer, position);

  console.log(await getPositions(deployer.address));

  await removeLiquidity(deployer, position, 1, Token1, Token2);

  console.log(await getPositions(deployer.address));

  // await swap(configuredPool, Token1, Token2);

  console.log(
    `Bal token1: ${format(await token1.balanceOf(deployer.address))}`,
  );
  console.log(
    `Bal token2: ${format(await token2.balanceOf(deployer.address))}`,
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
