// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./geo/GeoCellRegistry.sol";
import "./doc/DocumentRegistry.sol";

/*
 * @author Felipe Louzas
 * @notice Implementa registro de imóveis.
 */
contract ImovelRegistry is
    ERC721,
    ERC721URIStorage,
    Pausable,
    AccessControl,
    GeoCellRegistry,
    DocumentRegistry
{
    using Counters for Counters.Counter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    Counters.Counter private _propIdCounter;

    constructor(string memory _desc, uint16 _srid)
        ERC721("Registro de Imovel", "RGI")
        GeoCellRegistry(_desc, _srid)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function claimLand(
        address _for,
        string memory _metaUri,
        bytes memory _cellData
    ) public onlyRole(MINTER_ROLE) {
        _propIdCounter.increment(); // first valid property id starts with 1
        uint256 propId = _propIdCounter.current();
        _claimLand(propId, _cellData);
        _safeMint(_for, propId);
        _setTokenURI(propId, _metaUri);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
