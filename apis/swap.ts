import { ethers } from 'hardhat';
import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core';

import {
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

async function swap(
  pool: Pool,
  tokenIn: Token,
  tokenOut: Token,
  swapAmount: number,
) {
  const [deployer] = await ethers.getSigners();
  const swapRoute = new Route([pool], tokenIn, tokenOut);

  const amountOut = await getOutputQuote(
    swapRoute,
    tokenIn,
    swapAmount,
    deployer,
  );

  console.log(
    `Estimate Amount Token Out: ${format(BigInt(amountOut.toString()))}`,
  );
  const trade = await createTrade(swapRoute, tokenIn, tokenOut, amountOut);

  const options: SwapOptions = {
    slippageTolerance: new Percent(50, 10_000),
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    recipient: deployer.address,
  };

  const { calldata, value } = SwapRouter.swapCallParameters([trade], options);

  const transaction = {
    data: calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: value,
    from: deployer.address,
  };

  await deployer.sendTransaction(transaction);
}

export { swap, getOutputQuote, createTrade };
