import { ethers } from 'hardhat';
import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core';

import {
  FeeAmount,
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
} from '@uniswap/v3-sdk';
import { AbiCoder, Result, Signer } from 'ethers';
import { QUOTE_ADDRESS, SWAP_ROUTER_ADDRESS } from '../constants/address';
import { format } from '../utils';
import { getContract } from './pool';
import { SWAP_ROUTER_ABI } from '../constants/abi';

export type TokenTrade = Trade<Token, Token, TradeType>;

async function getOutputQuote(
  swapRoute: Route<Currency, Currency>,
  tokenIn: Token,
  amountIn: number,
  deployer: Signer,
) {
  const { calldata } = await SwapQuoter.quoteCallParameters(
    swapRoute,
    CurrencyAmount.fromRawAmount(
      tokenIn,
      ethers.parseEther(amountIn.toString()).toString(),
    ),
    TradeType.EXACT_INPUT,
    {
      useQuoterV2: false,
    },
  );

  const quoteCallReturnData = await deployer.call({
    to: QUOTE_ADDRESS,
    data: calldata,
  });

  return AbiCoder.defaultAbiCoder().decode(['uint256'], quoteCallReturnData);
}

async function createTrade(
  swapRoute: Route<Token, Token>,
  tokenIn: Token,
  tokenOut: Token,
  amountOut: Result,
): Promise<TokenTrade> {
  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(tokenIn, amountOut.toString()),
    outputAmount: CurrencyAmount.fromRawAmount(tokenOut, amountOut.toString()),
    tradeType: TradeType.EXACT_INPUT,
  });

  return uncheckedTrade;
}

async function singleSwap(
  pool: Pool,
  signer: any,
  tokenIn: Token,
  tokenOut: Token,
  amountIn: number,
  slippageTolerance: Percent,
  deadline: number,
) {
  const swapRoute = new Route([pool], tokenIn, tokenOut);

  const amountOut = await getOutputQuote(swapRoute, tokenIn, amountIn, signer);

  console.log(
    `Estimate Amount Token Out: ${format(BigInt(amountOut.toString()))}`,
  );
  const trade = await createTrade(swapRoute, tokenIn, tokenOut, amountOut);

  const options: SwapOptions = {
    slippageTolerance: slippageTolerance,
    deadline: deadline,
    recipient: signer.address,
  };

  const { calldata, value } = SwapRouter.swapCallParameters([trade], options);

  const transaction = {
    data: calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: value,
    from: signer.address,
  };

  await signer.sendTransaction(transaction);
}

const FEE_SIZE = 3;

function encodePath(path: string[], fees: FeeAmount[]): string {
  if (path.length != fees.length + 1) {
    throw new Error('path/fee lengths do not match');
  }

  let encoded = '0x';
  for (let i = 0; i < fees.length; i++) {
    // 20 byte encoding of the address
    encoded += path[i].slice(2);
    // 3 byte encoding of the fee
    encoded += fees[i].toString(16).padStart(2 * FEE_SIZE, '0');
  }
  // encode the final token
  encoded += path[path.length - 1].slice(2);

  return encoded.toLowerCase();
}

async function multiSwap(
  signer: any,
  tokenAddrPaths: string[],
  fees: number[],
  deadLine: number,
  amountIn: number,
  minAmountOut: number,
) {
  const path = encodePath(tokenAddrPaths, fees);

  //[token1,fee,token2,fee,token3,fee,token4]
  const params = {
    path,
    recipient: signer.address,
    deadline: deadLine,
    amountIn: ethers.parseEther(amountIn.toString()),
    amountOutMinimum: minAmountOut,
  };

  const swapRouterContract = await getContract(
    SWAP_ROUTER_ADDRESS,
    SWAP_ROUTER_ABI,
  );

  const encodedData = swapRouterContract.interface.encodeFunctionData(
    'exactInput',
    [params],
  );

  const transaction = {
    from: signer.address,
    to: SWAP_ROUTER_ADDRESS,
    data: encodedData,
    gasLimit: 1000000,
  };

  const res = await signer.sendTransaction(transaction);
  await res.wait();
}

export { singleSwap, multiSwap, getOutputQuote, createTrade, encodePath };
