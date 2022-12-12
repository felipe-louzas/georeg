const truffleAssert = require('truffle-assertions');
const ImovelRegistry = artifacts.require("ImovelRegistry");

const URI1 = 'bafybeidi6mtwtmm6vrncytqiliiofyhxq5ys476dl7sdpwcfxmuphnus3i';

const TRANSFER_EVENT = web3.utils.soliditySha3('Transfer(address,address,uint256)');

const REG = ["89c2598b57c", "89c2598b584", "89c2598b58c", "89c2598c97", "89c2598c99", "89c2598c9f", "89c2598ca4", "89c2598ca9", "89c2598caf", "89c2598cb04", "89c2598cbb", "89c2598cbd"];
const REG_NEIGHBOR = ["89c2598b55", "89c2598cab", "89c2598cad", "89c2598cb27", "89c2598cb29", "89c259f3514", "89c259f351c", "89c259f353", "89c259f355", "89c259f3564", "89c259f356c", "89c259f4a94", "89c259f4a9c", "89c259f4ab"];

const REG_LARGER = ["89c257", "89c259"];
const REG_LARGER_NEIGHBOR = ["89c257"]

const REG_SMALLER = ["89c2598ca85", "89c2598ca8f", "89c2598ca91", "89c2598ca9b"];

const REG_MULTIFACE = ["077ffffffc", "0780000004", "92d5555554", "932aaaaaac"];

const REG_30 = ["89c2598ca846bd55", "89c2598ca846bd57", "89c2598ca846bd53"];


contract("ImovelRegistry", (accounts) => {
    it("deve iniciar com saldo zerado", async () => {
        const instance = await ImovelRegistry.deployed();
        const balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance, 0, "saldo não está zerado");
    });

    it("deve registrar um imóvel", async () => {
        const instance = await ImovelRegistry.deployed();

        const claimTx = await instance.claimLand(accounts[0], URI1, pack_cell_data(REG));
        const txReceipt = await web3.eth.getTransactionReceipt(claimTx.receipt.transactionHash);
        const transferEvent = txReceipt.logs.find(log => log.topics[0] == TRANSFER_EVENT);
        const tokenId = transferEvent.topics[3];

        const balance = await instance.balanceOf.call(accounts[0]);
        const owner = await instance.ownerOf.call(tokenId);
        const tokenURI = await instance.tokenURI.call(tokenId);
        const propertyOf = await instance.propertyOf.call(pack_cell(REG[0]));

        assert.equal(balance, 1, "saldo da conta != 1 após mint");
        assert.equal(owner, accounts[0], "token não transferido corretamente");
        assert.equal(tokenURI, 'ipfs://' + URI1, "token URI incorreto");
        assert.equal(BigInt(propertyOf), tokenId, "propriedade nao atribuida a celula");
    });

    it("deve preservar saldos de um teste para o outro", async () => {
        const instance = await ImovelRegistry.deployed();
        const balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance, 1, "saldos não preservados");
    });

    it("deve registrar um imóvel vizinho", async () => {
        const instance = await ImovelRegistry.deployed();

        const claimTx = await instance.claimLand(accounts[0], URI1, pack_cell_data(REG_NEIGHBOR));
        const txReceipt = await web3.eth.getTransactionReceipt(claimTx.receipt.transactionHash);
        const transferEvent = txReceipt.logs.find(log => log.topics[0] == TRANSFER_EVENT);
        const tokenId = transferEvent.topics[3];

        const balance = await instance.balanceOf.call(accounts[0]);
        const owner = await instance.ownerOf.call(tokenId);
        const tokenURI = await instance.tokenURI.call(tokenId);

        assert.equal(balance, 2, "saldo da conta != 2 após mint");
        assert.equal(owner, accounts[0], "token não transferido corretamente");
        assert.equal(tokenURI, 'ipfs://' + URI1, "token URI incorreto");
    });

    it("não deve registrar imovel cobrindo outro", async () => {
        const instance = await ImovelRegistry.deployed();

        await truffleAssert.reverts(instance.claimLand(accounts[0], URI1, pack_cell_data(REG_LARGER)), "Registro sobrepoe area registrada");

        const balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance, 2, "saldo da conta != 2 após mint");
    });

    it("não deve registrar imovel dentro de outro", async () => {
        const instance = await ImovelRegistry.deployed();

        await truffleAssert.reverts(instance.claimLand(accounts[0], URI1, pack_cell_data(REG_SMALLER)), "Registro dentro de area ja registrada");

        const balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance, 2, "saldo da conta != 2 após mint");
    });

    it("retorna lista de celulas registradas acima da solicitada", async () => {
        const instance = await ImovelRegistry.deployed();

        const registeredCell = await instance.registeredCells.call(pack_cell("89c2598ca85"));
        const cellId = BigInt(registeredCell[0]).toString(16).replace(/0+$/, "");

        assert.equal(registeredCell.length, 1, "não retornou celula pai registrada");
        assert.equal(cellId, "89c2598ca9", "não retornou id correto da celula pai registrada");
    });

    it("retorna lista de celulas registradas dentro da area solicitada", async () => {
        const instance = await ImovelRegistry.deployed();

        const registeredCells = await instance.registeredCells.call(pack_cell("89c2598"));

        const cellIds = registeredCells.map(c => BigInt(c).toString(16).replace(/0+$/, ""));

        assert.equal(registeredCells.length, 26, "não retornou todas celulas filhas");
        assert.equal(cellIds.includes("89c2598c99"), true, "missing cell 89c2598c99");
        assert.equal(cellIds.includes("89c2598b57c"), true, "missing cell 89c2598b57c");
        assert.equal(cellIds.includes("89c259f356c"), true, "missing cell 89c259f356c");
        assert.equal(cellIds.includes("89c259f4ab"), true, "missing cell 89c259f4ab");
        assert.equal(cellIds.includes("89c2598b55"), true, "missing cell 89c2598b55");
    });

    it("retorna contagem de celulas filhas registradas", async () => {
        const instance = await ImovelRegistry.deployed();

        const totalCells = await instance.registeredCellsPerQuad.call(pack_cell("89"));
        const totalCellsCount = BigInt(totalCells[3]);

        assert.equal(totalCellsCount, 26, "contagem de celulas registradas inesperedada");

        const totalCells89c2598 = await instance.registeredCellsPerQuad.call(pack_cell("89c2598"));

        const q1 = BigInt(totalCells89c2598[0]);
        const q2 = BigInt(totalCells89c2598[1]);
        const q3 = BigInt(totalCells89c2598[2]);
        const q4 = BigInt(totalCells89c2598[3]);

        assert.equal(q1, 17, "contagem de celulas registradas inesperedada para 0x89c2598-1");
        assert.equal(q2, 0, "contagem de celulas registradas inesperedada para 0x89c2598-2");
        assert.equal(q3, 0, "contagem de celulas registradas inesperedada para 0x89c2598-3");
        assert.equal(q4, 9, "contagem de celulas registradas inesperedada para 0x89c2598-4");
    });
});




function pack_cell_data(cells) {
    // sort the arrays to find the common prefix, add to set to remove duplicates, bit-shift right to add 0 to msb
    const cellInts = [...new Set(cells.map(c => BigInt('0x' + c.padEnd(16, '0'))))].sort();

    let prefixLen = 0n;
    if (cellInts.length > 1) {
        const firstCell = cellInts[0];
        const lastCell = cellInts[cellInts.length - 1];

        if (firstCell >> 61n === lastCell >> 61n) {
            prefixLen = 3n;

            for (let idx = 59n; idx > 1n; idx = idx - 2n) {
                if (firstCell >> idx !== lastCell >> idx) break;
                prefixLen += 2n;
            }
        }
    }

    const output = [];

    if (prefixLen > 0) {
        prefixLen += 1n;
        output.push(Number(prefixLen) & 0x00ff);

        const prefix = cellInts[0] >> (65n - prefixLen)

        for (let idx = 0n; idx < prefixLen; idx += 8n) {
            const align = prefixLen - idx < 8n ? 8n - (prefixLen - idx) : 0n;
            output.push(Number(((prefix >> (prefixLen - 8n - idx + align)) << align) & 0x00ffn));
        }

    } else {
        output.push(0);
    }

    const mask = (2n ** (65n - prefixLen)) - 1n

    for (idx in cellInts) {
        let cellNoPrefix = cellInts[idx] & mask;

        // trim lsb zeros
        let trimmed = 0n;
        while ((cellNoPrefix & 3n) == 0n) {
            cellNoPrefix = cellNoPrefix >> 2n;
            trimmed += 2n;
        }

        // trim last bit
        cellNoPrefix = cellNoPrefix >> 1n;

        const cellLen = 65n - prefixLen - trimmed - 1n;

        output.push(Number(cellLen) & 0x00ff);

        for (let idx = 0n; idx < cellLen; idx += 8n) {
            const align = cellLen - idx < 8n ? 8n - (cellLen - idx) : 0n;
            output.push(Number(((cellNoPrefix >> (cellLen - 8n - idx + align)) << align) & 0x00ffn));
        }
    }

    return '0x' + toHexString(output);
}

function pack_cell(cell) {
    // sort the arrays to find the common prefix, add to set to remove duplicates, bit-shift right to add 0 to msb
    let cellInt = BigInt('0x' + cell.padEnd(16, '0'));

    // trim lsb zeros
    let trimmed = 0n;
    while ((cellInt & 3n) == 0n) {
        cellInt = cellInt >> 2n;
        trimmed += 2n;
    }

    // trim last bit
    cellInt = cellInt >> 1n;

    const cellLen = 65n - trimmed - 1n;

    const output = [];

    output.push(Number(cellLen) & 0x00ff);

    for (let idx = 0n; idx < cellLen; idx += 8n) {
        const align = cellLen - idx < 8n ? 8n - (cellLen - idx) : 0n;
        output.push(Number(((cellInt >> (cellLen - 8n - idx + align)) << align) & 0x00ffn));
    }

    return '0x' + toHexString(output);
}

function toHexString(byteArray) {
    return Array.from(byteArray, function (byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
}

