export type GeocodedFeature = {
  tokens: string[];
  cells: GeoJSON.MultiPolygon;
  poly: GeoJSON.Polygon;
  lat: string;
  lng: string;
};

export type GeocodedAreaResposne = {
  tokenId: string;
  level: number;
  quadTree: GeoJSON.Polygon[];
};

export async function geocode(
  geometry: GeoJSON.Geometry
): Promise<GeocodedFeature> {
  const resp = await fetch(
    `https://${process.env.REACT_APP_BACKEND_HOST}/geocode`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geometry),
    }
  );
  const json = await resp.json();
  return json;
}

export async function geocodeArea(
  bounds: number[][]
): Promise<GeocodedAreaResposne> {
  const resp = await fetch(
    `https://${process.env.REACT_APP_BACKEND_HOST}/geocodeArea`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bounds),
    }
  );
  const json = await resp.json();
  return json;
}

export async function getMultipolyForCells(
  cells: string[]
): Promise<GeoJSON.MultiPolygon> {
  const resp = await fetch(
    `https://${process.env.REACT_APP_BACKEND_HOST}/drawCells`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cells),
    }
  );
  const json = await resp.json();
  return json;
}

export function packCellData(tokenIds: string[]) {
  // sort the arrays to find the common prefix, add to set to remove duplicates, bit-shift right to add 0 to msb
  const cellInts = Array.from(
    new Set<bigint>(
      tokenIds.map((c) => BigInt("0x" + c.padEnd(16, "0")).valueOf())
    )
  ).sort();

  let prefixLen = 0;
  if (cellInts.length > 1) {
    const firstCell = cellInts[0];
    const lastCell = cellInts[cellInts.length - 1];

    if (firstCell >> BigInt(61) === lastCell >> BigInt(61)) {
      prefixLen = 3;

      for (let idx = 59; idx > 1; idx = idx - 2) {
        if (firstCell >> BigInt(idx) !== lastCell >> BigInt(idx)) break;
        prefixLen += 2;
      }
    }
  }

  const output: number[] = [];

  if (prefixLen > 0) {
    prefixLen += 1;
    output.push(Number(prefixLen) & 0x00ff);

    const prefix = cellInts[0] >> BigInt(65 - prefixLen);

    for (let idx = 0; idx < prefixLen; idx += 8) {
      const align = BigInt(prefixLen - idx < 8 ? 8 - (prefixLen - idx) : 0);
      output.push(
        Number(
          ((prefix >> (BigInt(prefixLen) - BigInt(8) - BigInt(idx) + align)) <<
            align) &
            BigInt(0x00ff)
        )
      );
    }
  } else {
    output.push(0);
  }

  const ALL_BITS = BigInt("0xFFFFFFFFFFFFFFFF");
  const mask =
    ((ALL_BITS << BigInt(prefixLen)) & ALL_BITS) >> BigInt(prefixLen);

  for (let idx in cellInts) {
    let cellNoPrefix = cellInts[idx] & mask;

    // trim lsb zeros
    let trimmed = 0;
    while ((cellNoPrefix & BigInt(3)) === BigInt(0)) {
      cellNoPrefix = cellNoPrefix >> BigInt(2);
      trimmed += 2;
    }

    // trim last bit
    cellNoPrefix = cellNoPrefix >> BigInt(1);

    const cellLen = BigInt(65 - prefixLen - trimmed - 1);

    output.push(Number(cellLen) & 0x00ff);

    for (let idx = 0; idx < cellLen; idx += 8) {
      const align =
        cellLen - BigInt(idx) < 8
          ? BigInt(8) - (cellLen - BigInt(idx))
          : BigInt(0);
      output.push(
        Number(
          ((cellNoPrefix >> (cellLen - BigInt(8) - BigInt(idx) + align)) <<
            align) &
            BigInt(0x00ff)
        )
      );
    }
  }

  return "0x" + _toHexString(output);
}

export function packCell(tokenId: string) {
  let cellInt = BigInt("0x" + tokenId.padEnd(16, "0"));

  // trim lsb zeros
  let trimmed = BigInt(0);
  while ((cellInt & BigInt(3)) === BigInt(0)) {
    cellInt = cellInt >> BigInt(2);
    trimmed += BigInt(2);
  }

  // trim last bit
  cellInt = cellInt >> BigInt(1);

  const cellLen = BigInt(65) - trimmed - BigInt(1);

  const output = [];

  output.push(Number(cellLen) & 0x00ff);

  for (let idx = BigInt(0); idx < cellLen; idx += BigInt(8)) {
    const align =
      cellLen - idx < BigInt(8) ? BigInt(8) - (cellLen - idx) : BigInt(0);
    output.push(
      Number(
        ((cellInt >> (cellLen - BigInt(8) - idx + align)) << align) &
          BigInt(0x00ff)
      )
    );
  }

  return "0x" + _toHexString(output);
}

function _toHexString(byteArray: number[]) {
  return Array.from(byteArray, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}
