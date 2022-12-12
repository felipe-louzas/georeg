import s2 from "@radarlabs/s2";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMultiPolyForCells } from "./_utilsS2";

type RequestBody = {
  geometry: GeoJSON.Geometry;
  minLevel?: number;
  maxLevel?: number;
  maxCells?: number;
};

const MIN_LEVEL = 1;
const MAX_LEVEL = 24;
const DEFAULT_MAX_CELLS = 300;

export function handler(req: VercelRequest, res: VercelResponse) {
  const body: RequestBody = req.body;

  if (body.geometry.type !== "Polygon") {
    res.status(400).json({
      error: "geometry precisa ser um objeto GeoJSON do tipo Polígono",
    });
    return;
  }

  const loopLLs: number[][] = body.geometry.coordinates[0].slice(1);

  const s2LLs = loopLLs.map(([lng, lat]) => new s2.LatLng(lat, lng));
  const covering = s2.RegionCoverer.getCovering(s2LLs, {
    min: body.minLevel || MIN_LEVEL,
    max: body.maxLevel || MAX_LEVEL,
    max_cells: body.maxCells || DEFAULT_MAX_CELLS,
  });

  if (!covering) {
    res.status(204);
    return;
  }

  const polyLine = new s2.Polyline(s2LLs);
  const cells = getMultiPolyForCells(covering.cellIds());

  res.json({
    tokens: covering.tokens(),
    cells: cells,
    poly: body.geometry,
    lat: polyLine.getCentroid().latitude(),
    lng: polyLine.getCentroid().longitude(),
  });
}
