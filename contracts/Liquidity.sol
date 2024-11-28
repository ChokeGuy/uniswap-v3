// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/base/LiquidityManagement.sol";

contract LiquidityExamples {
    INonfungiblePositionManager public immutable nftPosManager;
    constructor(INonfungiblePositionManager _nonfungiblePositionManager) {
        nftPosManager = _nonfungiblePositionManager;
    }

    struct CollectedFee {
        address fToken;
        address sToken;
        uint256 fAmount;
        uint256 sAmount;
    }

    modifier onlyNFTOwner(uint256 tokenId) {
        require(msg.sender == nftPosManager.ownerOf(tokenId), "Not the owner");
        _;
    }

    modifier onlySelf() {
        require(msg.sender == address(this), "Only self");
        _;
    }

    function mintNewPosition(
        INonfungiblePositionManager.MintParams memory params
    )
        external
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        TransferHelper.safeApprove(
            params.token0,
            address(nftPosManager),
            params.amount0Desired
        );
        TransferHelper.safeApprove(
            params.token1,
            address(nftPosManager),
            params.amount1Desired
        );
        (tokenId, liquidity, amount0, amount1) = nftPosManager.mint(params);
        // Remove allowance and refund in both assets.
        _transferExceedToken(
            params.token0,
            msg.sender,
            params.amount0Min - params.amount0Desired
        );

        // Remove allowance and refund in both assets.
        _transferExceedToken(
            params.token1,
            msg.sender,
            params.amount1Min - params.amount1Desired
        );
    }

    function _transferExceedToken(
        address _token,
        address _receiver,
        uint256 _remainAmount
    ) internal {
        if (_remainAmount <= 0) return;

        TransferHelper.safeApprove(_token, address(nftPosManager), 0);
        TransferHelper.safeTransferFrom(
            _token,
            address(this),
            _receiver,
            _remainAmount
        );
    }

    function collectAllFees(
        uint256 _tokenId,
        CollectedFee memory fee,
        INonfungiblePositionManager.CollectParams memory params
    ) external returns (uint256 fAmount, uint256 sAmount) {
        nftPosManager.safeTransferFrom(msg.sender, address(this), _tokenId);

        (fAmount, sAmount) = nftPosManager.collect(params);

        // send collected fee back to owner
        _sendToOwner(_tokenId, fee);
    }

    function decreaseLiquidity(
        CollectedFee memory fee,
        INonfungiblePositionManager.DecreaseLiquidityParams memory params
    )
        external
        onlyNFTOwner(params.tokenId)
        returns (uint256 amount0, uint256 amount1)                                         
    {
        (amount0, amount1) = nftPosManager.decreaseLiquidity(params);

        // send collected fee back to owner
        _sendToOwner(params.tokenId, fee);
    }

    function _sendToOwner(
        uint256 _tokenId,
        CollectedFee memory fee
    ) internal onlySelf {
        address _owner = nftPosManager.ownerOf(_tokenId);

        TransferHelper.safeTransferFrom(
            fee.fToken,
            address(this),
            _owner,
            fee.fAmount
        );
        TransferHelper.safeTransferFrom(
            fee.sToken,
            address(this),
            _owner,
            fee.sAmount
        );
    }

    function increaseLiquidity(
        INonfungiblePositionManager.IncreaseLiquidityParams memory params
    )
        external
        onlyNFTOwner(params.tokenId)
        returns (uint128 liquidity, uint256 amount0, uint256 amount1)
    {
        (liquidity, amount0, amount1) = nftPosManager.increaseLiquidity(params);
    }
}
