// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IEntropyConsumer } from "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
import { IEntropyV2 } from "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";

/**
 * @title JokeKioskSimple
 * @notice Vende bromas aceptando tokens/ETH y pide un número aleatorio a Pyth Entropy.
 *         El contrato está "sponsoreado": paga el fee de Entropy con su propio balance.
 * @dev    Mantiene un mapeo sequenceNumber -> requestId para emitir ambos en el callback.
 * @notice Recuerda ejecutar el approve del token antes de comprar. donde el spender es el contrato.
 */
contract JokeKioskV3 is IEntropyConsumer, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IEntropyV2 public entropy;
    mapping(address => bool) public allowedTokens;

    uint256 public requestCounter;
    mapping(uint64 => uint256) private seqToRequestId;

    event JokeRequested(uint256 requestId, address buyer, address token, uint256 price);
    event RandomReady(uint256 indexed requestId, uint64 indexed sequenceNumber, uint256 randomNumber);


    event TokenAllowed(address indexed tokenAddress);
    event TokenDisallowed(address indexed tokenAddress);

    error UnsupportedToken(address tokenAddress);
    error TransferFailed();
    error InsufficientGas();

    /*
    owner,
    ["0xf817257fed379853cDe0fa4F97AB987181B1E5Ea"] // usdc
    0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320 // pyth entropy
    */
    constructor(
        address initialOwner,
        address[] memory initialAllowedTokens,
        address entropyAddress
    ) Ownable(initialOwner) {
        entropy = IEntropyV2(entropyAddress);
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

    /**
     * @notice Fondea el contrato con el token nativo para cubrir fees de Entropy.
     * @dev   Simplemente manda ETH/MON a esta función o a receive().
     */
    function fundEntropy() external payable {}

    /**
     * @notice Retirar tokens acumulados.
     */
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
    
    function buyJoke(
        address tokenAddress,
        uint160 amountPaid
    ) external nonReentrant {
        if (!allowedTokens[tokenAddress]) revert UnsupportedToken(tokenAddress);
        require(amountPaid > 0, "No amount specified");

        // Transferir tokens
        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amountPaid);
        
        // Pide aleatorio a Pyth (paga el contrato)
        (uint256 requestId, uint64 sequenceNumber) = _requestEntropy();

        emit JokeRequested(
            block.timestamp,
            msg.sender,
            tokenAddress,
            amountPaid
        );
    }

// ====== Entropy (oráculo) ======

    /**
     * @dev Único lugar donde pedimos aleatorio y pagamos el fee con balance del contrato.
     */
    function _requestEntropy() internal returns (uint256 requestId, uint64 sequenceNumber) {
        uint256 fee = entropy.getFeeV2();

        // Validamos que el contrato tenga fondos para cubrir el fee
        if (address(this).balance < fee) revert InsufficientGas();

        requestId = ++requestCounter;
        sequenceNumber = entropy.requestV2{value: fee}();

        // Guardamos correlación: sequenceNumber -> requestId
        seqToRequestId[sequenceNumber] = requestId;
    }

    function entropyCallback(
        uint64 sequenceNumber,
        address /* provider */,
        bytes32 randomNumber
    ) internal override {
        uint256 requestId = seqToRequestId[sequenceNumber]; // 0 si no existe (no pasa en flujo normal)
        uint256 rnd = uint256(randomNumber);
        emit RandomReady(requestId, sequenceNumber, rnd);

        // Gas tiny: opcionalmente limpiar el mapeo
        delete seqToRequestId[sequenceNumber];
    }

    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    // Recibir ETH
    receive() external payable {}
}