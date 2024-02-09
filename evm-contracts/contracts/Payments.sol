//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Payments is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256[] public percentages;
    address[] public wallets;

    address public USDC;
    address public USDT;

    mapping(address => bool) public isShareHolder;

    enum Token {
        USDC,
        USDT
    }

    event TokensPaid(
        address indexed user,
        address indexed currency,
        uint256 amountPaid,
        uint256 timestamp
    );

    /// constructor
    constructor(address _usdc, address _usdt) Ownable(msg.sender) {
        require(_usdc != address(0) && _usdt != address(0), "Invalid address");

        USDC = _usdc;
        USDT = _usdt;
    }

    function buyWithEth()
        external
        payable
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        require(msg.value > 0, "Invalid Amount");
        require((msg.sender).balance >= msg.value, "Insufficient balance");

        emit TokensPaid(_msgSender(), address(0), msg.value, block.timestamp);
        return true;
    }

    function buyWithToken(Token _token, uint256 _amount)
        external
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        require(_token == Token.USDC || _token == Token.USDT, "Invalid token");
        require(_amount > 0, "Invalid amount");

        address token = _token == Token.USDC ? USDC : USDT;

        require(
            IERC20(token).allowance(msg.sender, address(this)) >= _amount,
            "Insufficient allowance"
        );
        require(
            IERC20(token).balanceOf(msg.sender) >= _amount,
            "Insufficient balance"
        );

        IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);

        emit TokensPaid(_msgSender(), token, _amount, block.timestamp);
        return true;
    }

    //  ------------------Admin functions---------------------------

    function setSplits(address[] memory _wallets, uint256[] memory _percentages)
        public
        onlyOwner
    {
        require(_wallets.length == _percentages.length, "Mismatched arrays");
        delete wallets;
        delete percentages;
        uint256 totalPercentage = 0;

        for (uint256 i = 0; i < _wallets.length; i++) {
            require(_percentages[i] > 0, "Percentage must be greater than 0");
            totalPercentage += _percentages[i];
            wallets.push(_wallets[i]);
            percentages.push(_percentages[i]);
            isShareHolder[_wallets[i]] = true;
        }

        require(totalPercentage == 100, "Total percentage must equal 100");
    }

    function withdrawToken(Token _token) external {
        require(isShareHolder[msg.sender], "Not a shareholder");
        require(_token == Token.USDC || _token == Token.USDT, "Invalid token");

        address token = _token == Token.USDT ? USDT : USDC;
        uint256 amount = IERC20(token).balanceOf(address(this));

        require(amount > 0, "No balance");

        if (wallets.length == 0) {
            (bool success, ) = address(token).call(
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    owner(),
                    amount
                )
            );
            require(success, "Token payment failed");
        } else {
            uint256 dust;
            for (uint256 i = 0; i < wallets.length; i++) {
                uint256 amountToTransfer = (amount * percentages[i]) / 100;
                (bool success, ) = address(token).call(
                    abi.encodeWithSignature(
                        "transfer(address,uint256)",
                        wallets[i],
                        amountToTransfer
                    )
                );
                require(success, "Token payment failed");
                dust += amountToTransfer;
            }
            if ((amount - dust) > 0) {
                (bool success, ) = address(token).call(
                    abi.encodeWithSignature(
                        "transfer(address,uint256)",
                        wallets[wallets.length - 1],
                        amount - dust
                    )
                );
                require(success, "Token payment failed");
            }
        }
    }

    function withdrawEth() external {
        require(isShareHolder[msg.sender], "Not a shareholder");
        uint256 amount = address(this).balance;

        require(amount > 0, "No balance");
        
        if (wallets.length == 0) {
            (bool success, ) = payable(owner()).call{value: amount}("");
            require(success, "ETH Payment failed");
        } else {
            uint256 dust;
            for (uint256 i = 0; i < wallets.length; i++) {
                uint256 amountToTransfer = (amount * percentages[i]) / 100;

                (bool success, ) = payable(wallets[i]).call{
                    value: amountToTransfer
                }("");

                require(success, "ETH Payment failed");
                dust += amountToTransfer;
            }
            if ((amount - dust) > 0) {
                (bool success, ) = (wallets[wallets.length - 1]).call{
                    value: amount - dust
                }("");

                require(success, "ETH Payment failed");
            }
        }
    }

    function updateToken(address _usdt, address _usdc) external onlyOwner {
        require(_usdc != address(0) && _usdt != address(0), "Invalid address");

        USDC = _usdc;
        USDT = _usdt;
    }

    /**
     * @dev To pause the presale
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev To unpause the presale
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
