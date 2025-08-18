// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Contrato que no usa el permit2
contract JokeKiosk is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    mapping(address => bool) public allowedTokens;

    event JokeRequested(uint256 requestId, address buyer, address token, uint256 price);
    event RandomReady(uint256 requestId, uint256 seed);


    event TokenAllowed(address indexed tokenAddress);
    event TokenDisallowed(address indexed tokenAddress);

    error UnsupportedToken(address tokenAddress);
    error TransferFailed();
    error InsufficientPermitAmount();

    constructor(
        address initialOwner,
        address[] memory initialAllowedTokens
    ) Ownable(initialOwner) {
        for (uint256 i = 0; i < initialAllowedTokens.length; i++) {
            allowedTokens[initialAllowedTokens[i]] = true;
            emit TokenAllowed(initialAllowedTokens[i]);
        }
    }

    /**
     * @dev Permite al owner agregar un token a la lista de permitidos.
     */
    function allowToken(address tokenAddress) external onlyOwner {
        allowedTokens[tokenAddress] = true;
        emit TokenAllowed(tokenAddress);
    }

    /**
     * @dev Permite al owner remover un token de la lista de permitidos.
     */
    function disallowToken(address tokenAddress) external onlyOwner {
        allowedTokens[tokenAddress] = false;
        emit TokenDisallowed(tokenAddress);
    }

    function buyJoke(
        address tokenAddress,
        uint160 amountPaid
    ) external nonReentrant {
        require(amountPaid > 0, "No amount specified");
        if (!allowedTokens[tokenAddress]) revert UnsupportedToken(tokenAddress);

        IERC20(tokenAddress).transfer(address(this), amountPaid);

        emit JokeRequested(
            block.timestamp,
            msg.sender,
            tokenAddress,
            amountPaid
        );
    }
}