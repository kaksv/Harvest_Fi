// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Test.sol";
import "../src/CropPriceOracle.sol";

contract CropPriceOracleTest is Test {
    CropPriceOracle oracle;

    address admin = address(0xA);
    address stranger = address(0xB);

    function setUp() public {
        oracle = new CropPriceOracle(admin, 5e6);
    }

    function test_quoteUSDC_convertsGramsAtUSDCPerKg() public view {
        assertEq(oracle.quoteUSDC(500_000), 2_500e6);
    }

    function test_quoteUSDC_roundsUpPartialKilograms() public view {
        assertEq(oracle.quoteUSDC(1), 5_000);
    }

    function test_setPricePerKgUSDC_onlyAdmin() public {
        vm.prank(stranger);
        vm.expectRevert(CropPriceOracle.Unauthorized.selector);
        oracle.setPricePerKgUSDC(6e6);

        vm.prank(admin);
        oracle.setPricePerKgUSDC(6e6);
        assertEq(oracle.pricePerKgUSDC(), 6e6);
    }

    function test_revert_invalidPriceAndWeight() public {
        vm.expectRevert(CropPriceOracle.InvalidPrice.selector);
        new CropPriceOracle(admin, 0);

        vm.expectRevert(CropPriceOracle.InvalidWeight.selector);
        oracle.quoteUSDC(0);
    }
}