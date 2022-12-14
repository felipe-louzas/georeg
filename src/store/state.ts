import GeoJSON from "geojson";
import { GeocodedFeature } from "../services/geocoding";

export const geocodedFeatures: {
  [id: string | number]: Promise<GeocodedFeature>;
} = {};

interface State {
  registeredFeatures?: GeoJSON.MultiPolygon;
  locationCache: { [id: string]: number[] };
  cellCache: { [id: string]: string[] };
}

export const state: State = {
  locationCache: {},
  cellCache: {},
};
