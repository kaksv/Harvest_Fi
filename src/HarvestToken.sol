// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title HarvestToken
/// @notice ERC-20 representing a claim on a future crop harvest (e.g. hCOFFEE).
///         Each token == 1 USD-cent of the forward contract's face value.
///         Minting and burning are restricted to the HarvestPool contract (owner).
contract HarvestToken is ERC20Permit, Ownable {
    constructor(string memory name_, string memory symbol_, address pool_)
        ERC20(name_, symbol_)
        ERC20Permit(name_)
        Ownable(pool_)
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
