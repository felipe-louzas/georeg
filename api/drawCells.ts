import s2 from "@radarlabs/s2";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMultiPolyForCells } from "./_utilsS2";

export function handler(req: VercelRequest, res: VercelResponse) {
  const tokens: string[] = req.body;
  const cellIds = tokens.map((t) => new s2.CellId(t));
  const cells = getMultiPolyForCells(cellIds);
  res.json(cells);
}
