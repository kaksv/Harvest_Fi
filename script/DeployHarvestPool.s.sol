// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/CropPriceOracle.sol";
import "../src/HarvestPool.sol";

/// @notice Deploy HarvestFi to Base Sepolia.
///
/// Usage:
///   forge script script/DeployHarvestPool.s.sol:DeployHarvestPool \
///     --rpc-url $BASE_SEPOLIA_RPC_URL \
///     --private-key $DEPLOYER_PRIVATE_KEY \
///     --broadcast --verify \
///     --etherscan-api-key $BASESCAN_API_KEY
///
/// Env vars required (copy .env.example → .env and fill in):
///   DEPLOYER_PRIVATE_KEY   — deployer wallet
///   ADMIN_ADDRESS          — multisig / admin wallet that owns the pool
///   USDC_ADDRESS           — Base Sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
///   CHAINLINK_FEED_ADDRESS — ETH/USD on Base Sepolia (coffee placeholder):
///                            0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1
///   BASE_SEPOLIA_RPC_URL   — e.g. https://sepolia.base.org
///   BASESCAN_API_KEY       — from basescan.org
contract DeployHarvestPool is Script {
    function run() external {
        address admin    = vm.envAddress("ADMIN_ADDRESS");
        address usdc     = vm.envAddress("USDC_ADDRESS");
        address feed     = vm.envAddress("CHAINLINK_FEED_ADDRESS");

        vm.startBroadcast();

        // 1. Deploy the crop price oracle (ETH/USD as coffee placeholder)
        CropPriceOracle oracle = new CropPriceOracle(feed);

        // 2. Deploy the pool
        HarvestPool pool = new HarvestPool(usdc, admin);

        // 3. Register oracle for hCOFFEE and hVANILLA (both point to same feed on testnet)
        pool.setOracle("hCOFFEE",  address(oracle));
        pool.setOracle("hVANILLA", address(oracle));

        vm.stopBroadcast();

        // ── Log deployed addresses for the frontend .env ─────────────────────
        console2.log("CropPriceOracle : ", address(oracle));
        console2.log("HarvestPool     : ", address(pool));
        console2.log("USDC            : ", usdc);
        console2.log("Admin           : ", admin);
    }
}
