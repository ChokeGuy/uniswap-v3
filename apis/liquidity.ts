import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core';
import {
  Position,
  CollectOptions,
  RemoveLiquidityOptions,
  NonfungiblePositionManager,
  MintOptions,
} from '@uniswap/v3-sdk';
import { getContract } from './pool';
import { NFT_MANAGER_ABI } from '../constants/abi';
import { POSITION_MANAGER_ADDRESS } from '../constants/address';

async function addLiquidity(signer: any, position: Position) {
  const mintOptions: MintOptions = {
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
  };

  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    position,
    mintOptions,
  );

  const transaction = {
    data: calldata,
    to: POSITION_MANAGER_ADDRESS,
    value: value,
    from: signer.address,
  };

  const txRes = await signer.sendTransaction(transaction);
  await txRes.wait();
}

async function removeLiquidity(
  signer: any,
  position: Position,
  index: number,
  tokenA: Token,
  tokenB: Token,
  removePercent: Percent,
) {
  const collectOptions: Omit<CollectOptions, 'tokenId'> = {
    expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(tokenA, 0),
    expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(tokenB, 0),
    recipient: signer.address,
  };

  const nftPosManagerContract = await getContract(
    POSITION_MANAGER_ADDRESS,
    NFT_MANAGER_ABI,
  );

  const positionId = (
    await nftPosManagerContract.tokenOfOwnerByIndex(signer.address, index)
  ).toString();

  const removeLiquidityOptions: RemoveLiquidityOptions = {
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
    // percentage of liquidity to remove
    liquidityPercentage: removePercent,
    collectOptions,
    tokenId: positionId,
  };

  const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
    position,
    removeLiquidityOptions,
  );

  const transaction = {
    data: calldata,
    to: POSITION_MANAGER_ADDRESS,
    value: value,
    from: signer.address,
  };

  const txRes = await signer.sendTransaction(transaction);
  await txRes.wait();
}

export { addLiquidity, removeLiquidity };
