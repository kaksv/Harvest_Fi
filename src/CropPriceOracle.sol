// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title CropPriceOracle
/// @notice Converts pledged crop weight into a USDC target using an explicit
///         crop price in USDC units per kilogram.
///
///         targetUSDC = ceil(weightGrams * pricePerKgUSDC / 1000)
///
/// @dev This demo oracle is admin-controlled. A production deployment should
///      replace it with a signed price source or a verified commodity feed.
contract CropPriceOracle {
    error InvalidAdmin();
    error InvalidPrice();
    error Unauthorized();
    error InvalidWeight();

    address public immutable admin;
    uint256 public pricePerKgUSDC;

    event PriceUpdated(uint256 indexed pricePerKgUSDC);

    constructor(address admin_, uint256 initialPricePerKgUSDC_) {
        if (admin_ == address(0)) revert InvalidAdmin();
        if (initialPricePerKgUSDC_ == 0) revert InvalidPrice();

        admin = admin_;
        pricePerKgUSDC = initialPricePerKgUSDC_;
        emit PriceUpdated(initialPricePerKgUSDC_);
    }

    /// @notice Update the crop price in USDC's 6-decimal units per kilogram.
    function setPricePerKgUSDC(uint256 pricePerKgUSDC_) external {
        if (msg.sender != admin) revert Unauthorized();
        if (pricePerKgUSDC_ == 0) revert InvalidPrice();

        pricePerKgUSDC = pricePerKgUSDC_;
        emit PriceUpdated(pricePerKgUSDC_);
    }

    /// @notice Compute the USDC target amount for a given weight.
    /// @param weightGrams Weight of the crop in grams (e.g. 500_000 for 500 kg)
    /// @return usdcAmount Amount in USDC's 6-decimal units
    function quoteUSDC(uint256 weightGrams) external view returns (uint256 usdcAmount) {
        if (weightGrams == 0) revert InvalidWeight();

        // Round up partial cents so a small fractional kilogram is not free.
        usdcAmount = (weightGrams * pricePerKgUSDC + 999) / 1000;
    }
}
