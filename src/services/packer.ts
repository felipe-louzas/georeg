export function packCellData(tokenIds: string[]) {
  // sort the arrays to find the common prefix, add to set to remove duplicates, bit-shift right to add 0 to msb

  const tokenSet = new Set(
    tokenIds.map((c) => BigInt("0x" + c.padEnd(16, "0")))
  );
  const cellIds: bigint[] = Array.from(tokenSet).sort();
  const output: number[] = [];

  /*
   * Check common prefix
   */
  let prefixLen = 0;
  if (cellIds.length > 1) {
    const firstCellId = cellIds[0];
    const lastCellId = cellIds[cellIds.length - 1];

    // check if faceId is the same
    const firstFaceId = firstCellId >> BigInt(61);
    const lastFaceId = lastCellId >> BigInt(61);
    if (firstFaceId === lastFaceId) {
      prefixLen = 3;

      for (let shft = BigInt(59); shft >= BigInt(3); shft -= BigInt(2)) {
        const firstQuad = (firstCellId >> shft) & BigInt(0b11);
        const lastQuad = (lastCellId >> shft) & BigInt(0b11);
        if (firstQuad !== lastQuad) break;
        prefixLen += 2;
      }
    }
  }

  /*
   * Output prefix
   */
  if (prefixLen > 0) {
    prefixLen += 1;

    const prefix = cellIds[0] >> BigInt(65 - prefixLen);
    _outputBytes(output, prefix, prefixLen);
  } else {
    output.push(0);
  }

  /*
   * Output cells
   */
  const mask = BigInt("0xFFFFFFFFFFFFFFFF") >> BigInt(prefixLen - 1);
  for (let idx in cellIds) {
    let cellNoPrefix = cellIds[idx] & mask;
    _outputCell(output, cellNoPrefix, prefixLen);
  }

  return "0x" + _toHexString(output);
}

export function packCell(tokenId: string) {
  let cellInt = BigInt("0x" + tokenId.padEnd(16, "0"));
  const output: number[] = [];
  _outputCell(output, cellInt, 0);
  return "0x" + _toHexString(output);
}

function _outputCell(output: number[], cellValue: bigint, prefixLen: number) {
  // trim lsb zeros
  let trimmed = 0;
  while ((cellValue & BigInt(0b11)) === BigInt(0)) {
    cellValue = cellValue >> BigInt(2);
    trimmed += 2;
  }

  // trim last bit
  cellValue = cellValue >> BigInt(1);
  trimmed += 1;

  const cellLen = 65 - prefixLen - trimmed;
  _outputBytes(output, cellValue, cellLen);
}

function _outputBytes(output: number[], value: bigint, lenBits: number) {
  output.push(lenBits);

  for (let idx = 0; idx < lenBits; idx += 8) {
    const bitsLeft = lenBits - idx;
    const shftL = BigInt(bitsLeft < 8 ? 8 - bitsLeft : 0);
    const shftR = BigInt(bitsLeft - 8);
    const byteMask = BigInt(0xff);
    const mask = (byteMask << shftL) & byteMask;
    const byteVal = (value >> shftR) & mask;
    output.push(Number(byteVal));
  }
}

function _toHexString(byteArray: number[]) {
  return Array.from(byteArray, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}
