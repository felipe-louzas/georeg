export interface GeocodedFeature {
  tokens: string[];
  cells: GeoJSON.MultiPolygon;
  poly: GeoJSON.Polygon;
  lat: string;
  lng: string;
}

export interface GeocodedAreaResposne {
  tokenId: string;
  level: number;
  quadTree: GeoJSON.Polygon[];
}

export interface Cell {
  token: string;
  lat: number;
  lng: number;
  poly: number[][][];
}

export type CellQuadResponse = { [id: string]: Cell[] };

export async function geocode(
  geometry: GeoJSON.Geometry,
  minLevel: number,
  maxLevel: number,
  maxCells: number
): Promise<GeocodedFeature> {
  const resp = await fetch(`/api/geocode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      geometry: geometry,
      minLevel: minLevel,
      maxLevel: maxLevel,
      maxCells: maxCells,
    }),
  });
  const json = await resp.json();
  return json;
}

export async function getMultipolyForCells(
  cells: string[]
): Promise<GeoJSON.MultiPolygon> {
  const resp = await fetch(`/api/drawCells`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cells),
  });
  const json = await resp.json();
  return json;
}

export async function getCellQuadrants(
  cellIds: string[]
): Promise<CellQuadResponse> {
  const resp = await fetch(`/api/cellQuads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cellIds),
  });
  const json = await resp.json();
  return json;
}
