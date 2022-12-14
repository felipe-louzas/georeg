import s2 from "@radarlabs/s2";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMultiPolyForCells, getPolygonForCell } from "./_utilsS2";

interface Cell {
  token: string;
  lat: number;
  lng: number;
  poly: number[][][];
}

export default function cellQuads(req: VercelRequest, res: VercelResponse) {
  const tokens: string[] = req.body;
  const cellIds = tokens.map((t) => new s2.CellId(t));

  const quads: { [id: string]: Cell[] } = {};

  for (let idx in cellIds) {
    const cellId = cellIds[idx];
    const cells: Cell[] = [];

    for (let q = 0; q < 4; q++) {
      const childId = cellId.child(q as s2.ChildPosition);
      const child = new s2.Cell(childId);
      const center = new s2.LatLng(child.getCenter());
      const poly = getPolygonForCell(childId);
      cells.push({
        token: childId.token(),
        lat: center.latitude(),
        lng: center.longitude(),
        poly: poly,
      });
    }

    quads[cellId.token()] = cells;
  }

  res.json(quads);
}
