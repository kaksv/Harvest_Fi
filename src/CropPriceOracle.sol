// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @dev Minimal Chainlink feed interface — no extra dependency needed.
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);

    function decimals() external view returns (uint8);
}

/// @title CropPriceOracle
/// @notice Converts a weight (in grams, to avoid floats) to a USDC target amount
///         using a Chainlink USD price feed for the crop.
///
///         targetUSDC = weightGrams * priceUSDperKg / 1000   (in 6-decimal USDC units)
///
/// @dev Base Sepolia Chainlink feeds (testnet proxies):
///      There is no native coffee feed on Chainlink yet, so we use the
///      ETH/USD feed as a stand-in for the hackathon and document the
///      slot where a real commodity feed (e.g. via Chainlink Data Streams
///      or a custom EA) would plug in.
contract CropPriceOracle {
    AggregatorV3Interface public immutable priceFeed;

    /// @param feed_ Chainlink AggregatorV3 address for this crop's USD price.
    ///              On Base Sepolia you can use 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1 (ETH/USD)
    ///              as a placeholder until a commodity feed is available.
    constructor(address feed_) {
        priceFeed = AggregatorV3Interface(feed_);
    }

    /// @notice Returns the latest crop price in USD with the feed's native decimals.
    function latestPriceUSD() public view returns (int256 price, uint8 feedDecimals) {
        uint256 updatedAt;
        (,price,,updatedAt,) = priceFeed.latestRoundData();
        require(price > 0, "CropPriceOracle: stale feed");
        require(block.timestamp - updatedAt < 2 hours, "CropPriceOracle: stale feed");
        feedDecimals = priceFeed.decimals();
    }

    /// @notice Compute the USDC target amount for a given weight.
    /// @param weightGrams  Weight of the crop in grams (e.g. 500_000 for 500 kg)
    /// @return usdcAmount  Amount in USDC 6-decimal units
    function quoteUSDC(uint256 weightGrams) external view returns (uint256 usdcAmount) {
        (int256 price, uint8 feedDecimals) = latestPriceUSD();

        // price has `feedDecimals` decimals (usually 8 for Chainlink USD feeds)
        // weightGrams / 1000 = kg
        // usdcAmount (6 dec) = weightGrams * pricePerKg_usd / 1000
        //                    = weightGrams * price / 10^feedDecimals / 1000  * 10^6
        //                    = weightGrams * price * 10^6 / (1000 * 10^feedDecimals)
        usdcAmount = (weightGrams * uint256(price) * 1e6) / (1000 * 10 ** feedDecimals);
    }
}
