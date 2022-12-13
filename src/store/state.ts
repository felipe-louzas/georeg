import GeoJSON from "geojson";
import { GeocodedFeature } from "../services/geocoding";

export const geocodedFeatures: {
  [id: string | number]: Promise<GeocodedFeature>;
} = {};

interface State {
  registeredFeatures?: GeoJSON.MultiPolygon;
}

export const state: State = {};
