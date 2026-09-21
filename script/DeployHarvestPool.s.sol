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
///   COFFEE_PRICE_PER_KG_USDC — initial coffee price in USDC's 6-decimal units per kg
///   VANILLA_PRICE_PER_KG_USDC — initial vanilla price in USDC's 6-decimal units per kg
///   BASE_SEPOLIA_RPC_URL   — e.g. https://sepolia.base.org
///   BASESCAN_API_KEY       — from basescan.org
contract DeployHarvestPool is Script {
    function run() external {
        address admin = vm.envAddress("ADMIN_ADDRESS");
        address usdc = vm.envAddress("USDC_ADDRESS");
        uint256 coffeePricePerKgUSDC = vm.envUint("COFFEE_PRICE_PER_KG_USDC");
        uint256 vanillaPricePerKgUSDC = vm.envUint("VANILLA_PRICE_PER_KG_USDC");

        vm.startBroadcast();

        // 1. Deploy separate crop price oracles with explicit USDC/kg prices.
        CropPriceOracle coffeeOracle = new CropPriceOracle(admin, coffeePricePerKgUSDC);
        CropPriceOracle vanillaOracle = new CropPriceOracle(admin, vanillaPricePerKgUSDC);

        // 2. Deploy the pool
        HarvestPool pool = new HarvestPool(usdc, admin);

        // 3. Register the configured demo price for each crop.
        pool.setOracle("hCOFFEE", address(coffeeOracle));
        pool.setOracle("hVANILLA", address(vanillaOracle));

        vm.stopBroadcast();

        // ── Log deployed addresses for the frontend .env ─────────────────────
        console2.log("CoffeeOracle    : ", address(coffeeOracle));
        console2.log("VanillaOracle   : ", address(vanillaOracle));
        console2.log("HarvestPool     : ", address(pool));
        console2.log("USDC            : ", usdc);
        console2.log("Admin           : ", admin);
    }
}
