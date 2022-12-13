import React, { useState, useRef } from "react";
import { useCelo } from "@celo/react-celo";
import { AbiItem } from "web3-utils";
import ImovelRegistry from "../../web3/types/ImovelRegistry.json";

import Map, {
  NavigationControl,
  Source,
  Layer,
  MapboxEvent,
  MapRef,
} from "react-map-gl";

import {
  DrawCreateEvent,
  DrawUpdateEvent,
  DrawDeleteEvent,
  DrawSelectionChangeEvent,
} from "@mapbox/mapbox-gl-draw";

import DrawControl from "./DrawControl";
import DetailPanel from "./DetailPanel";

import {
  GeocodedFeature,
  geocode,
  geocodeArea,
  packCell,
  getMultipolyForCells,
} from "../../services/geocoding";
import { geocodedFeatures, state } from "../../store/state";

import "mapbox-gl/dist/mapbox-gl.css";
import "./MapPage.css";

let lastMappedToken: string;
let mapping = false;

export default function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const { kit } = useCelo();
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<GeocodedFeature>();
  const [cells, setCells] = useState<GeoJSON.FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  /*
   * Map draw events
   */

  function onFeatureSelection(evt: DrawSelectionChangeEvent) {
    if (evt.features.length > 0) {
      const { id } = evt.features[0];
      if (!id) return;
      selectFeature(id);
    } else {
      unselectFeature();
    }
  }

  function onFeatureDelete(evt: DrawDeleteEvent) {
    if (evt.features.length === 0) return;
    const { id } = evt.features[0];
    if (!id) return;

    unselectFeature();
    removeFeature(id);
  }

  async function onFeatureUpdate(evt: DrawUpdateEvent) {
    if (evt.features.length === 0) return;
    const { id, geometry } = evt.features[0];
    if (!id) return;

    removeFeature(id);
    const feature = await addFeature(id, geometry);
    setSelectedFeature(feature);
  }

  function onFeatureCreate(evt: DrawCreateEvent) {
    if (evt.features.length === 0) return;
    const { id, geometry } = evt.features[0];
    if (!id) return;

    addFeature(id, geometry);
  }

  /**
   * Feature selection
   */

  async function selectFeature(id: string | number) {
    setShowSidebar(true);

    const feature = await geocodedFeatures[id];
    setSelectedFeature(feature);
  }

  function unselectFeature() {
    setSelectedFeature(undefined);
    setShowSidebar(false);
  }

  /*
   * Feature management
   */

  function removeFeature(id: string | number) {
    setSelectedFeature(undefined);
    delete geocodedFeatures[id];
    onFeaturesUpdated();
  }

  async function addFeature(id: string | number, geometry: GeoJSON.Geometry) {
    geocodedFeatures[id] = geocode(geometry);
    const feature = await geocodedFeatures[id];
    await onFeaturesUpdated();
    return feature;
  }

  async function toFeature(id: string | number): Promise<GeoJSON.Feature> {
    return {
      type: "Feature",
      properties: {
        id: id,
      },
      geometry: (await geocodedFeatures[id]).cells,
    };
  }

  async function onMapIdle(evt: MapboxEvent) {
    const ref = mapRef.current;
    if (!ref) return;

    if (mapping) return;
    mapping = true;

    try {
      const canvas = ref.getMap().getCanvas();

      const w = canvas.width;
      const h = canvas.height;
      const cUL = ref.unproject([0, 0]).toArray();
      const cUR = ref.unproject([w, 0]).toArray();
      const cLR = ref.unproject([w, h]).toArray();
      const cLL = ref.unproject([0, h]).toArray();

      const resp = await geocodeArea([cUL, cUR, cLR, cLL]);
      if (resp.tokenId === lastMappedToken) return;

      const imovelRegistry = new kit.connection.web3.eth.Contract(
        ImovelRegistry.abi as AbiItem[],
        "0xE6dE4daff89851E371506ee49148e55a2D1266F9"
      );

      const ret: string[] = await imovelRegistry.methods
        .registeredCells(packCell(resp.tokenId))
        .call();

      if (!ret) return;

      const cellIds = ret.map((c) => BigInt(c).toString(16).replace(/0+$/, ""));

      const multipoly = await getMultipolyForCells(cellIds);
      state.registeredFeatures = multipoly;
      lastMappedToken = resp.tokenId;
      await onFeaturesUpdated();
    } finally {
      mapping = false;
    }
  }

  async function onFeaturesUpdated() {
    const features: GeoJSON.Feature[] = await Promise.all(
      Object.keys(geocodedFeatures).map(toFeature)
    );

    if (state.registeredFeatures) {
      features.push({
        type: "Feature",
        properties: {
          id: "reg",
        },
        geometry: state.registeredFeatures,
      });
    }

    setCells({
      type: "FeatureCollection",
      features: features,
    });
  }

  /**
   * Component Tree
   */

  return (
    <div className="map-page flex-fill">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -47.8828,
          latitude: -15.79407,
          zoom: 14,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken="pk.eyJ1IjoiZmxvdXphcyIsImEiOiJjanh0OHJqcDUwczMwM2huNXVyY3BsMW93In0.tF1mUbJU49VZdnVTaLFIUw"
        onIdle={onMapIdle}
      >
        <Source id="cells" type="geojson" data={cells}>
          <Layer
            id="cells-layer"
            type="fill"
            paint={{ "fill-opacity": 0.3, "fill-color": "#00998c" }}
          />
        </Source>
        <NavigationControl position="top-left" visualizePitch />
        <DrawControl
          position="top-left"
          onCreate={onFeatureCreate}
          onUpdate={onFeatureUpdate}
          onDelete={onFeatureDelete}
          onSelect={onFeatureSelection}
          controls={{
            point: false,
            line_string: false,
            polygon: true,
            combine_features: false,
            uncombine_features: false,
          }}
        />
      </Map>
      <DetailPanel show={showSidebar} feature={selectedFeature} />
    </div>
  );
}
