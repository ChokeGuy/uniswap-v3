import { getContract } from '../apis/pool';
import { NFT_MANAGER_ABI } from '../constants/abi';
import { POSITION_MANAGER_ADDRESS } from '../constants/address';

async function getPositionIds(signerAddr: string) {
  const calls = [];

  const nftPosManagerContract = await getContract(
    POSITION_MANAGER_ADDRESS,
    NFT_MANAGER_ABI,
  );

  const numPositions = await nftPosManagerContract.balanceOf(signerAddr);

  for (let i = 0; i < numPositions; i++) {
    calls.push(nftPosManagerContract.tokenOfOwnerByIndex(signerAddr, i));
  }

  const positionIds = await Promise.all(calls);

  return positionIds;
}

async function getPositions(signerAddr: string) {
  const positionCalls = [];

  const nftPosManagerContract = await getContract(
    POSITION_MANAGER_ADDRESS,
    NFT_MANAGER_ABI,
  );

  const positionIds = await getPositionIds(signerAddr);

  for (let id of positionIds) {
    positionCalls.push(nftPosManagerContract.positions(id));
  }

  const callResponses = await Promise.all(positionCalls);

  const positionInfos = callResponses.map((position: any) => {
    return {
      tickLower: position.tickLower,
      tickUpper: position.tickUpper,
      liquidity: position.liquidity,
      feeGrowthInside0LastX128: position.feeGrowthInside0LastX128,
      feeGrowthInside1LastX128: position.feeGrowthInside1LastX128,
      tokensOwed0: position.tokensOwed0,
      tokensOwed1: position.tokensOwed1,
    };
  });

  return positionInfos;
}

export { getPositions };
