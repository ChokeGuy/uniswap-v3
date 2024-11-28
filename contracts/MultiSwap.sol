// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract MultiSwap {
    ISwapRouter public immutable swapRouter;
    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    // For this example, we will set the pool fee to 0.3%.
    uint24 public constant poolFee = 3000;

    constructor(ISwapRouter _swapRouter) {
        swapRouter = _swapRouter;
    }

    function swapExactInputMutiple(
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        TransferHelper.safeTransferFrom(
            DAI,
            msg.sender,
            address(this),
            amountIn
        );

        TransferHelper.safeApprove(DAI, address(swapRouter), amountIn);
        uint minOut = 0;

        bytes memory path = abi.encodePacked(
            DAI,
            poolFee,
            USDC,
            poolFee,
            WETH9
        );

        ISwapRouter.ExactInputParams memory params = ISwapRouter
            .ExactInputParams({
                path: path,
                recipient: msg.sender,
                deadline: block.timestamp + 15 minutes,
                amountIn: amountIn,
                amountOutMinimum: minOut
            });

        //Execute the swap
        amountOut = swapRouter.exactInput(params);
    }

    //WETH9 -> DAI
    //Contract approve and get DAI from msg.sender
    //swap WETH9 -> USDC -> DAI
    function swapExactOutputMultiple(
        uint256 amountOut,
        uint256 amountInMaximum
    ) external returns (uint256 amountIn) {
        TransferHelper.safeTransferFrom(
            DAI,
            msg.sender,
            address(this),
            amountInMaximum
        );

        TransferHelper.safeApprove(DAI, address(swapRouter), amountInMaximum);

        uint256 maxIn = /* Calculate min output */ amountInMaximum;

        bytes memory path = abi.encodePacked(
            WETH9,
            poolFee,
            USDC,
            poolFee,
            DAI
        );

        ISwapRouter.ExactOutputParams memory params = ISwapRouter
            .ExactOutputParams({
                path: path,
                recipient: msg.sender,
                deadline: block.timestamp + 15 minutes,
                amountOut: amountOut,
                amountInMaximum: maxIn
            });

        amountIn = swapRouter.exactOutput(params);

        // For exact output swaps, the amountInMaximum may not have all been spent.
        // If the actual amount spent (amountIn) is less than the specified maximum amount, we must refund the msg.sender and approve the swapRouter to spend 0.
        if (amountIn < amountInMaximum) {
            TransferHelper.safeApprove(DAI, address(swapRouter), 0);
            TransferHelper.safeTransferFrom(
                DAI,
                address(this),
                msg.sender,
                amountInMaximum - amountIn
            );
        }
    }
}
