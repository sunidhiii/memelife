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

    address public USDT;
    address public USDC;

    // mapping(address => uint256) public totalAmount;

    enum Token {
        USDT,
        USDC
    }

    event TokensBought(
        address indexed user,
        address indexed currency,
        uint256 amountPaid,
        uint256 timestamp
    );

    /// constructor
    constructor(address _usdt, address _usdc) Ownable(msg.sender) {
        require(_usdt != address(0) && _usdc != address(0), "Invalid address");

        USDT = _usdt;
        USDC = _usdc;
    }

    function buyWithEth()
        external
        payable
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        require(msg.value >= 0, "Invalid Amount");
        require(
            (msg.sender).balance >= msg.value,
            "Insufficient balance"
        );
        splitETHValue(msg.value);

        emit TokensBought(_msgSender(), address(0), msg.value, block.timestamp);
        return true;
    }

    function buyWithToken(
        Token _token,
        uint256 _amount
    ) external whenNotPaused nonReentrant returns (bool) {
        require(_token == Token.USDC || _token == Token.USDC, "Invalid token");
        require(_amount > 0, "Invalid amount");
        
        address token = _token == Token.USDT ? USDT : USDC; 

        require(
            IERC20(token).allowance(msg.sender, address(this)) >= _amount,
            "Insufficient allowance"
        );
        require(
            IERC20(token).balanceOf(msg.sender) >= _amount,
            "Insufficient balance"
        );

        IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);

        splitTokenValue(token, _amount);
        emit TokensBought(_msgSender(), token, _amount, block.timestamp);
        return true;
    }

    // ------------------Internal functions---------------------------

    function splitETHValue(uint256 _amount) internal {
        if (wallets.length == 0) {
            sendValue(payable(owner()), _amount);
        } else {
            uint256 dust;
            for (uint256 i = 0; i < wallets.length; i++) {
                uint256 amountToTransfer = (_amount * percentages[i]) / 100;
                sendValue(payable(wallets[i]), amountToTransfer);
                dust += amountToTransfer;
            }
            if ((_amount - dust) > 0) {
                sendValue(
                    payable(wallets[wallets.length - 1]),
                    _amount - dust
                );
            }
        }
    }

    function splitTokenValue(address _token, uint256 _amount) internal {
        if (wallets.length == 0) {
            (bool success, ) = address(_token).call(
                abi.encodeWithSignature(
                    "transferFrom(address,address,uint256)",
                    _msgSender(),
                    owner(),
                    _amount
                )
            );
            require(success, "Token payment failed");
        } else {
            uint256 dust;
            for (uint256 i = 0; i < wallets.length; i++) {
                uint256 amountToTransfer = (_amount * percentages[i]) / 100;
                (bool success, ) = address(_token).call(
                    abi.encodeWithSignature(
                        "transferFrom(address,address,uint256)",
                        _msgSender(),
                        wallets[i],
                        amountToTransfer
                    )
                );
                require(success, "Token payment failed");
                dust += amountToTransfer;
            }
            if ((_amount - dust) > 0) {
                (bool success, ) = address(_token).call(
                    abi.encodeWithSignature(
                        "transferFrom(address,address,uint256)",
                        _msgSender(),
                        wallets[wallets.length - 1],
                        _amount - dust
                    )
                );
                require(success, "Token payment failed");
            }
        }
    }

    function sendValue(address payable _recipient, uint256 _amount) internal {
        require(address(this).balance >= _amount, "Low balance");
        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "ETH Payment failed");
    }

    //  ------------------Admin functions---------------------------

    function setSplits(
        address[] memory _wallets,
        uint256[] memory _percentages
    ) public onlyOwner {
        require(_wallets.length == _percentages.length, "Mismatched arrays");
        delete wallets;
        delete percentages;
        uint256 totalPercentage = 0;

        for (uint256 i = 0; i < _wallets.length; i++) {
            require(_percentages[i] > 0, "Percentage must be greater than 0");
            totalPercentage += _percentages[i];
            wallets.push(_wallets[i]);
            percentages.push(_percentages[i]);
        }

        require(totalPercentage == 100, "Total percentage must equal 100");
    }

    function updateToken(address _usdt, address _usdc) external onlyOwner {
        require(_usdt != address(0) && _usdc != address(0), "Invalid address");

        USDT = _usdt;
        USDC = _usdc;
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
