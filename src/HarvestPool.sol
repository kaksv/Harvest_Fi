// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./HarvestToken.sol";
import "./CropPriceOracle.sol";

/// @title HarvestPool
/// @notice Forward-contract escrow for tokenised crop harvests.
///
/// Flow:
///   1. Cooperative calls `createContract` → HarvestToken (hTOKEN) is deployed.
///   2. Investors call `invest` with USDC → receive hTOKENs 1:1 (6-decimal parity).
///   3. Off-taker calls `settle` with total USDC owed → funds enter escrow.
///   4. Token holders call `redeem` → burn hTOKENs, receive proportional USDC.
///
/// All amounts in USDC's 6-decimal unit.
contract HarvestPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Data ────────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;

    enum Status { Funding, Settled, Cancelled }

    struct ForwardContract {
        address cooperative;        // farmer cooperative address
        HarvestToken token;         // hTOKEN for this contract
        uint256 targetAmount;       // total USDC to raise (6 dec)
        uint256 raisedAmount;       // USDC currently held in escrow
        uint256 settledAmount;      // USDC paid in by off-taker
        uint256 deadline;           // funding deadline (unix timestamp)
        string  metadataCID;        // IPFS CID for proof-of-farm docs
        Status  status;
    }

    uint256 public nextId;
    mapping(uint256 => ForwardContract) public contracts;

    // ─── Events ──────────────────────────────────────────────────────────────

    event ContractCreated(uint256 indexed id, address cooperative, address token, uint256 targetAmount, uint256 deadline);
    event Invested(uint256 indexed id, address investor, uint256 amount);
    event Settled(uint256 indexed id, address offTaker, uint256 amount);
    event Redeemed(uint256 indexed id, address holder, uint256 tokensBurned, uint256 usdcReturned);
    event Cancelled(uint256 indexed id);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error NotCooperative();
    error InvalidAmount();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error WrongStatus();
    error Overfund();
    error NoOracle();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address usdc_, address admin_) Ownable(admin_) {
        usdc = IERC20(usdc_);
    }

    // ─── Oracle registry ─────────────────────────────────────────────────────

    /// @notice Admin registers a CropPriceOracle per crop symbol (e.g. "hCOFFEE").
    mapping(string => CropPriceOracle) public oracles;

    function setOracle(string calldata symbol_, address oracle_) external onlyOwner {
        oracles[symbol_] = CropPriceOracle(oracle_);
    }

    // ─── Cooperative ─────────────────────────────────────────────────────────

    /// @notice Register a new harvest forward contract.
    /// @param name_        ERC-20 name  (e.g. "Harvest Coffee 2025-Q4")
    /// @param symbol_      ERC-20 symbol (e.g. "hCOFFEE")
    /// @param targetAmount Total USDC the cooperative wants to raise
    /// @param deadline     Unix timestamp when funding closes
    /// @param metadataCID  IPFS CID pointing to proof-of-farm documents
    function createContract(
        string calldata name_,
        string calldata symbol_,
        uint256 targetAmount,
        uint256 deadline,
        string calldata metadataCID
    ) external returns (uint256 id) {
        if (targetAmount == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert DeadlinePassed();

        return _createContract(msg.sender, name_, symbol_, targetAmount, deadline, metadataCID);
    }

    function _createContract(
        address cooperative_,
        string calldata name_,
        string calldata symbol_,
        uint256 targetAmount,
        uint256 deadline,
        string calldata metadataCID
    ) internal returns (uint256 id) {
        HarvestToken token = new HarvestToken(name_, symbol_, address(this));

        id = nextId++;
        contracts[id] = ForwardContract({
            cooperative:   cooperative_,
            token:         token,
            targetAmount:  targetAmount,
            raisedAmount:  0,
            settledAmount: 0,
            deadline:      deadline,
            metadataCID:   metadataCID,
            status:        Status.Funding
        });

        emit ContractCreated(id, cooperative_, address(token), targetAmount, deadline);
    }

    /// @notice Same as createContract but derives targetAmount from weight × oracle price.
    /// @param symbol_      Must match a registered oracle key (e.g. "hCOFFEE")
    /// @param weightGrams  Pledged harvest weight in grams (e.g. 500_000 for 500 kg)
    function createContractByWeight(
        string calldata name_,
        string calldata symbol_,
        uint256 weightGrams,
        uint256 deadline,
        string calldata metadataCID
    ) external returns (uint256 id) {
        CropPriceOracle oracle = oracles[symbol_];
        if (address(oracle) == address(0)) revert NoOracle();
        uint256 targetAmount = oracle.quoteUSDC(weightGrams);
        return _createContract(msg.sender, name_, symbol_, targetAmount, deadline, metadataCID);
    }

    // ─── Investor ────────────────────────────────────────────────────────────

    /// @notice Buy hTOKENs with USDC. 1 USDC (1e6) = 1 hTOKEN (1e6).
    function invest(uint256 id, uint256 amount) external nonReentrant {
        ForwardContract storage fc = _active(id);
        if (block.timestamp > fc.deadline) revert DeadlinePassed();
        if (amount == 0) revert InvalidAmount();
        if (fc.raisedAmount + amount > fc.targetAmount) revert Overfund();

        fc.raisedAmount += amount;
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        fc.token.mint(msg.sender, amount);

        // Release raised funds to cooperative immediately (working capital)
        usdc.safeTransfer(fc.cooperative, amount);

        emit Invested(id, msg.sender, amount);
    }

    // ─── Off-taker ───────────────────────────────────────────────────────────

    /// @notice Pay the settlement amount in USDC after physical delivery.
    ///         Can be called in one or multiple tranches until fully settled.
    function settle(uint256 id, uint256 amount) external nonReentrant {
        ForwardContract storage fc = _active(id);
        if (amount == 0) revert InvalidAmount();

        fc.settledAmount += amount;
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Mark fully settled once off-taker has paid at least the raised amount
        if (fc.settledAmount >= fc.raisedAmount) {
            fc.status = Status.Settled;
            emit Settled(id, msg.sender, fc.settledAmount);
        }
    }

    // ─── Token Holder ────────────────────────────────────────────────────────

    /// @notice Burn hTOKENs and receive proportional USDC from the settled pool.
    function redeem(uint256 id, uint256 tokenAmount) external nonReentrant {
        ForwardContract storage fc = contracts[id];
        if (fc.status != Status.Settled) revert WrongStatus();
        if (tokenAmount == 0) revert InvalidAmount();

        // Pro-rata share: usdcOut = tokenAmount * settledAmount / totalSupply
        uint256 supply = fc.token.totalSupply();
        uint256 usdcOut = (tokenAmount * fc.settledAmount) / supply;

        fc.settledAmount -= usdcOut;
        fc.token.burn(msg.sender, tokenAmount);
        usdc.safeTransfer(msg.sender, usdcOut);

        emit Redeemed(id, msg.sender, tokenAmount, usdcOut);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    /// @notice Cancel a funding round after deadline if underfunded (return nothing
    ///         — funds already went to cooperative as working capital, so this
    ///         simply marks the contract inactive to stop new investments).
    function cancel(uint256 id) external onlyOwner {
        ForwardContract storage fc = _active(id);
        if (block.timestamp <= fc.deadline) revert DeadlineNotPassed();
        fc.status = Status.Cancelled;
        emit Cancelled(id);
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _active(uint256 id) internal view returns (ForwardContract storage fc) {
        fc = contracts[id];
        if (fc.status != Status.Funding) revert WrongStatus();
    }
}
