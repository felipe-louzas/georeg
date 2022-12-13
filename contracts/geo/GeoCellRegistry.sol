// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @author Felipe Louzas
 * @notice Implementa registro de celulas geoindexadas associadas a imoveis.
 */
abstract contract GeoCellRegistry {
    /**
     * @notice Nome descritivo do registro
     */
    string public desc;

    /**
     * @notice Código EPSG do Sistema de Referência Geospacial
     */
    uint16 public srid;

    struct GeoCellNode {
        uint256 propId;
        uint64[4] childrenCount;
        mapping(uint8 => GeoCellNode) children;
    }

    GeoCellNode[6] private _registeredLand;

    constructor(string memory _desc, uint16 _srid) {
        require(
            (_srid >= 1024 && _srid <= 32767),
            "Codigo EPSG deve estar entre 1024 e 32767"
        );
        require(bytes(_desc)[0] != 0, "Descritivo vazio");

        desc = _desc;
        srid = _srid;
    }

    /**
     * Cell data structure:
     * == 89C2598B58C = 100 01001110000100101100110001 011010110001 10000000000000000000000
     * == 89C2598C97  = 100 01001110000100101100110001 1001001011 1000000000000000000000000
     * - remove lsb + sentinel
     * - add zero bit to msb
     * == 89C2598B58C = 0100 01001110000100101100110001 011010110001
     * == 89C2598C97  = 0100 01001110000100101100110001 1001001011
     * - encode prefix and cells into byte array, prepend bit length in first byte
     * == [prefix len (30)][0100 0100][11100001][00101100][110001--][cell0 len (12)][01101011][0001----][cell1 len (10)][10010010][11------]
     */
    function _claimLand(uint256 _propId, bytes memory _cellData) internal {
        require(_propId > 0, "ID da propriedade deve ser maior que 0");

        uint8 prefixBits = uint8(_cellData[0]);
        require(prefixBits % 2 == 0, "Tamanho do prefixo invalido");

        if (prefixBits == 0) {
            uint256 pos = 0;

            while (pos < _cellData.length) {
                uint8 blockLen = uint8(_cellData[pos]);
                pos += 1;

                require(
                    blockLen > 0 && blockLen % 2 == 0,
                    "Tamanho do bloco invalido"
                );

                _claimCell(_propId, pos, blockLen, _cellData);
                pos += ((blockLen - 1) / 8) + 1;
            }
        } else {
            GeoCellNode storage commonNode = _getCommonNode(
                prefixBits,
                _cellData
            );

            uint8 cellsClaimed = 0;
            uint256 pos = ((prefixBits - 1) / 8) + 2;
            while (pos < _cellData.length) {
                uint8 blockLen = uint8(_cellData[pos]);
                pos += 1;

                require(
                    blockLen > 0 && blockLen % 2 == 0,
                    "Tamanho do bloco invalido"
                );

                _claimCell(_propId, commonNode, pos, blockLen, 0, _cellData);
                cellsClaimed += 1;
                pos += ((blockLen - 1) / 8) + 1;
            }

            _updateParentRegisteredCount(prefixBits, _cellData, cellsClaimed);
        }
    }

    function _updateParentRegisteredCount(
        uint8 prefixBits,
        bytes memory _cellData,
        uint8 cellsClaimed
    ) internal {
        uint8 faceId = (uint8(_cellData[1]) >> 4) & 0x7;
        GeoCellNode storage commonNode = _registeredLand[faceId]; // set commonNode to face cell

        for (uint8 bit = 4; bit < prefixBits; bit += 2) {
            uint8 quadKey = _getQuadKey(_cellData, 1, bit);

            commonNode.childrenCount[quadKey] += cellsClaimed;
            commonNode = commonNode.children[quadKey];

            require(
                commonNode.propId == 0,
                "Registro dentro de area ja registrada"
            );
        }
    }

    function _getCommonNode(uint8 prefixBits, bytes memory _cellData)
        internal
        view
        returns (GeoCellNode storage)
    {
        uint8 faceId = (uint8(_cellData[1]) >> 4) & 0x7;
        GeoCellNode storage commonNode = _registeredLand[faceId]; // set commonNode to face cell
        // it´s not possible to register the whole face cell, so no need for propId check;

        for (uint8 bit = 4; bit < prefixBits; bit += 2) {
            uint8 quadKey = _getQuadKey(_cellData, 1, bit);

            commonNode = commonNode.children[quadKey];

            require(
                commonNode.propId == 0,
                "Registro dentro de area ja registrada"
            );
        }

        return commonNode;
    }

    function _claimCell(
        uint256 _propId,
        uint256 _pos,
        uint8 _blockLen,
        bytes memory _cellData
    ) internal {
        uint8 faceId = (uint8(_cellData[_pos]) >> 4) & 0x7;
        GeoCellNode storage commonNode = _registeredLand[faceId];
        _claimCell(_propId, commonNode, _pos, _blockLen, 4, _cellData);
    }

    function _claimCell(
        uint256 _propId,
        GeoCellNode storage _commonNode,
        uint256 _pos,
        uint8 _blockLen,
        uint8 _offset,
        bytes memory _cellData
    ) internal {
        GeoCellNode storage currentNode = _commonNode;

        for (uint8 bit = _offset; bit < _blockLen; bit += 2) {
            uint8 quadKey = _getQuadKey(_cellData, _pos, bit);

            currentNode.childrenCount[quadKey] += 1;
            currentNode = currentNode.children[quadKey];

            require(
                currentNode.propId == 0,
                "Registro dentro de area ja registrada"
            );
        }

        // currentNode can be registered if no children nodes exist
        for (uint8 quadKey = 0; quadKey < 4; quadKey++) {
            require(
                currentNode.childrenCount[quadKey] == 0,
                "Registro sobrepoe area registrada"
            );
        }

        currentNode.propId = _propId;
    }

    function _getQuadKey(
        bytes memory _cellData,
        uint256 _byteOffset,
        uint8 _bitOffset
    ) internal pure returns (uint8 quadKey) {
        return
            (uint8(_cellData[_bitOffset / 8 + _byteOffset]) >>
                (6 - (_bitOffset % 8))) & 0x3;
    }

    function registeredCellsPerQuad(bytes memory _parentCell)
        public
        view
        returns (uint64[] memory ret)
    {
        GeoCellNode storage currentNode = _getNode(_parentCell);
        ret = new uint64[](4);

        ret[0] = currentNode.childrenCount[0];
        ret[1] = currentNode.childrenCount[1];
        ret[2] = currentNode.childrenCount[2];
        ret[3] = currentNode.childrenCount[3];

        return ret;
    }

    function propertyOf(bytes memory _parentCell)
        public
        view
        returns (uint256 propId)
    {
        GeoCellNode storage currentNode = _getNode(_parentCell);
        return currentNode.propId;
    }

    function registeredCells(bytes memory _parentCell)
        public
        view
        returns (uint64[] memory ret)
    {
        uint8 blockLen = uint8(_parentCell[0]);

        uint8 faceId = (uint8(_parentCell[1]) >> 4) & 0x7;
        GeoCellNode storage currentNode = _registeredLand[faceId];

        uint64 currentNodeId = 0;
        uint8 pos = 64;

        pos -= 3;
        currentNodeId = currentNodeId + uint64((faceId & 0x7) * 2**pos);

        for (uint8 bit = 4; bit < blockLen; bit += 2) {
            uint8 quadKey = _getQuadKey(_parentCell, 1, bit);
            currentNode = currentNode.children[quadKey];

            pos -= 2;
            currentNodeId = currentNodeId + uint64((quadKey & 0x3) * 2**pos);

            if (currentNode.propId > 0) {
                pos -= 1;
                currentNodeId = currentNodeId + uint64((1 & 0x1) * 2**pos);

                ret = new uint64[](1);
                ret[0] = currentNodeId;
                return ret;
            }
        }

        // nenhuma das celulas superiores estão registradas. Necessário verificar celulas filhas

        uint64 totalCells = 0;
        for (uint8 idx = 0; idx < 4; idx++) {
            totalCells += currentNode.childrenCount[idx];
        }

        if (totalCells == 0) {
            ret = new uint64[](0);
            return ret;
        }

        ret = new uint64[](totalCells);
        _addAllCells(currentNode, currentNodeId, pos, 0, ret);

        return ret;
    }

    function _addAllCells(
        GeoCellNode storage _node,
        uint64 _currentNodeId,
        uint8 _pos,
        uint64 _startIdx,
        uint64[] memory ret
    ) internal view returns (uint64) {
        uint64 localIdx = 0;

        for (uint8 idx = 0; idx < 4; idx++) {
            if (_node.childrenCount[idx] > 0) {
                GeoCellNode storage childNode = _node.children[idx];

                uint64 currentNodeId = _currentNodeId +
                    uint64((idx & 0x3) * 2**(_pos - 2));

                if (childNode.propId > 0) {
                    currentNodeId =
                        currentNodeId +
                        uint64((1 & 0x1) * 2**(_pos - 3));

                    ret[_startIdx + localIdx] = currentNodeId;
                    localIdx++;
                } else {
                    localIdx += _addAllCells(
                        childNode,
                        currentNodeId,
                        _pos - 2,
                        _startIdx + localIdx,
                        ret
                    );
                }
            }
        }

        return localIdx;
    }

    function _getNode(bytes memory _cell)
        internal
        view
        returns (GeoCellNode storage node)
    {
        uint8 blockLen = uint8(_cell[0]);

        uint8 faceId = (uint8(_cell[1]) >> 4) & 0x7;
        GeoCellNode storage currentNode = _registeredLand[faceId];

        for (uint8 bit = 4; bit < blockLen; bit += 2) {
            uint8 quadKey = _getQuadKey(_cell, 1, bit);
            currentNode = currentNode.children[quadKey];
        }

        return currentNode;
    }
}
