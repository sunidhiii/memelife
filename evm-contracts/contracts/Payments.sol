//SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

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
    mapping(address => bool) public wertWhitelisted;    

    enum Token {
        USDC,
        USDT
    }

    event TokensPaid(
        address indexed user,
        address indexed currency,
        uint256 amountPaid,
        string solAddress
    );

    event TokensUpdated(address _usdc, address _usdt, uint256  timeStamp);

    /// constructor
    constructor(address _usdc, address _usdt) Ownable(msg.sender) {
        require(_usdc != address(0) && _usdt != address(0), "Invalid address");

        USDC = _usdc;
        USDT = _usdt;
    }

    function buyWithEth(string memory _user)
        external
        payable
        whenNotPaused
        returns (bool)
    {
        require(msg.value > 0, "Invalid Amount");

        emit TokensPaid(msg.sender, address(0), msg.value, _user);
        return true;
    }

    function buyWithToken(Token _token, string memory _user, uint256 _amount)
        external
        whenNotPaused
        returns (bool)
    {
        require(_token == Token.USDC || _token == Token.USDT, "Invalid token");
        require(_amount > 0, "Invalid amount");

        address token = _token == Token.USDC ? USDC : USDT;

        IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);

        emit TokensPaid(msg.sender, token, _amount, _user);
        return true;
    }

    function buyWithWert(string memory _user, uint256 _amount)
        external
        payable
        whenNotPaused
        returns (bool)
    {
        require(
            wertWhitelisted[msg.sender],
            "User not whitelisted for this tx"
        );
        // require(_amount == msg.value, "Invalid amount");

        emit TokensPaid(msg.sender, address(0), _amount, _user);
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

    function withdrawToken(Token _token) external nonReentrant {
        require(msg.sender == owner() || isShareHolder[msg.sender], "Not a shareholder");
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

    function withdrawEth() external nonReentrant {
        require(msg.sender == owner() || isShareHolder[msg.sender], "Not a shareholder");
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

    function whitelistUsersForWERT(
        address[] calldata _addressesToWhitelist
    ) external onlyOwner {
        for (uint256 i = 0; i < _addressesToWhitelist.length; i++) { 
            wertWhitelisted[_addressesToWhitelist[i]] = true;
        }
    }

    function blacklistUsersForWERT(
        address[] calldata _addressesToWhitelist
    ) external onlyOwner {
        for (uint256 i = 0; i < _addressesToWhitelist.length; i++) { 
            wertWhitelisted[_addressesToWhitelist[i]] = false;
        }
    }

    function updateToken(address _usdt, address _usdc) external onlyOwner {
        require(_usdc != address(0) && _usdt != address(0), "Invalid address");

        USDC = _usdc;
        USDT = _usdt;

        emit TokensUpdated(_usdc, _usdt, block.timestamp);
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
