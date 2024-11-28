// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

contract Factory {
    address public owner;
    IUniswapV3Factory public immutable factory;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    constructor(IUniswapV3Factory _factory) {
        factory = _factory;
        owner = msg.sender;
    }
}
