// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Test.sol";
import "../src/HarvestPool.sol";
import "../src/HarvestToken.sol";

/// @dev Minimal mock USDC (6 decimals)
contract MockUSDC is ERC20("USD Coin", "USDC") {
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract HarvestPoolTest is Test {
    MockUSDC   usdc;
    HarvestPool pool;

    address admin       = address(0xA);
    address cooperative = address(0xB);
    address investor    = address(0xC);
    address offTaker    = address(0xD);

    uint256 TARGET   = 1_000e6;  // 1,000 USDC
    uint256 DEADLINE;

    function setUp() public {
        usdc = new MockUSDC();
        pool = new HarvestPool(address(usdc), admin);
        DEADLINE = block.timestamp + 30 days;

        usdc.mint(investor, 2_000e6);
        usdc.mint(offTaker,  2_000e6);

        vm.prank(investor);
        usdc.approve(address(pool), type(uint256).max);

        vm.prank(offTaker);
        usdc.approve(address(pool), type(uint256).max);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    function _create() internal returns (uint256 id) {
        vm.prank(cooperative);
        id = pool.createContract("Harvest Coffee 2025-Q4", "hCOFFEE", TARGET, DEADLINE, "ipfs://Qm...");
    }

    // ── tests ─────────────────────────────────────────────────────────────────

    function test_createContract() public {
        uint256 id = _create();
        (address coop,,uint256 target,,,,, HarvestPool.Status status) = pool.contracts(id);
        assertEq(coop, cooperative);
        assertEq(target, TARGET);
        assertEq(uint8(status), uint8(HarvestPool.Status.Funding));
    }

    function test_invest_mintsTokensAndForwardsFunds() public {
        uint256 id = _create();
        (,HarvestToken token,,,,,,) = pool.contracts(id);

        uint256 coopBefore = usdc.balanceOf(cooperative);

        vm.prank(investor);
        pool.invest(id, TARGET);

        // Investor holds hTOKENs 1:1
        assertEq(token.balanceOf(investor), TARGET);
        // Cooperative received working capital immediately
        assertEq(usdc.balanceOf(cooperative), coopBefore + TARGET);
    }

    function test_settle_and_redeem() public {
        uint256 id = _create();
        (,HarvestToken token,,,,,,) = pool.contracts(id);

        vm.prank(investor);
        pool.invest(id, TARGET);

        // Off-taker settles full amount
        vm.prank(offTaker);
        pool.settle(id, TARGET);

        (,,,,,,, HarvestPool.Status status) = pool.contracts(id);
        assertEq(uint8(status), uint8(HarvestPool.Status.Settled));

        // Investor redeems
        uint256 balBefore = usdc.balanceOf(investor);
        vm.prank(investor);
        pool.redeem(id, TARGET);

        assertEq(usdc.balanceOf(investor), balBefore + TARGET);
        assertEq(token.balanceOf(investor), 0);
    }

    function test_revert_overfund() public {
        uint256 id = _create();
        vm.prank(investor);
        vm.expectRevert(HarvestPool.Overfund.selector);
        pool.invest(id, TARGET + 1);
    }

    function test_revert_redeemBeforeSettled() public {
        uint256 id = _create();
        vm.prank(investor);
        pool.invest(id, TARGET);

        vm.prank(investor);
        vm.expectRevert(HarvestPool.WrongStatus.selector);
        pool.redeem(id, TARGET);
    }

    function test_cancel_afterDeadline() public {
        uint256 id = _create();
        vm.warp(DEADLINE + 1);

        vm.prank(admin);
        pool.cancel(id);

        (,,,,,,, HarvestPool.Status status) = pool.contracts(id);
        assertEq(uint8(status), uint8(HarvestPool.Status.Cancelled));
    }
}
