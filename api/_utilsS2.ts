import s2 from "@radarlabs/s2";

export function getMultiPolyForCells(cellIds: s2.CellId[]) {
  const poligons = cellIds.map((cid) => getPolygonForCell(cid));

  return {
    type: "MultiPolygon",
    coordinates: poligons,
  };
}

export function getPolygonForCell(cellId: s2.CellId): number[][][] {
  const cell = new s2.Cell(cellId);

  const v0 = cell.getVertex(0);
  const v1 = cell.getVertex(1);
  const v2 = cell.getVertex(2);
  const v3 = cell.getVertex(3);

  const ringVertexArr = [v0, v1, v2, v3, v0];

  const linearRing: number[][] = ringVertexArr
    .map((v) => new s2.LatLng(v).normalized())
    .map((latLng) => [latLng.longitude(), latLng.latitude()]);

  return [linearRing];
}
