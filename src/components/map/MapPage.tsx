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
  Marker,
} from "react-map-gl";

import {
  DrawCreateEvent,
  DrawUpdateEvent,
  DrawDeleteEvent,
  DrawSelectionChangeEvent,
} from "@mapbox/mapbox-gl-draw";

import DrawControl, { drawControl } from "./DrawControl";
import DetailPanel from "./DetailPanel";

import {
  GeocodedFeature,
  getMultipolyForCells,
  geocode,
  getCellQuadrants,
  Cell,
} from "../../services/geocoding";
import { packCell } from "../../services/packer";
import { geocodedFeatures, state } from "../../store/state";

import "mapbox-gl/dist/mapbox-gl.css";
import "./MapPage.css";

export default function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const { kit } = useCelo();
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<GeocodedFeature>();
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>();
  const [cells, setCells] = useState<GeoJSON.FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const [registeredCells, setRegisteredCells] =
    useState<GeoJSON.FeatureCollection>({
      type: "FeatureCollection",
      features: [],
    });
  const [markers, setMarkers] = useState<Cell[]>([]);
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
    setSelectedFeatureId(id.toString());
    setShowSidebar(true);

    const feature = await geocodedFeatures[id];
    setSelectedFeature(feature);
  }

  function unselectFeature() {
    setSelectedFeature(undefined);
    setSelectedFeatureId(undefined);
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
    geocodedFeatures[id] = geocode(geometry, 1, 24, 300);
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

  async function loadCells() {
    const ref = mapRef.current;
    if (!ref) return;

    const canvas = ref.getCanvas();
    const zoom = ref.getZoom() | 0;

    const w = canvas.width;
    const h = canvas.height;
    const cUL: number[] = ref.unproject([0, 0]).toArray();
    const cUR: number[] = ref.unproject([w, 0]).toArray();
    const cLR: number[] = ref.unproject([w, h]).toArray();
    const cLL: number[] = ref.unproject([0, h]).toArray();

    const geometry: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [[cUL, cUR, cLR, cLL, cUL]],
    };

    const imovelRegistry = new kit.connection.web3.eth.Contract(
      ImovelRegistry.abi as AbiItem[],
      "0xE6dE4daff89851E371506ee49148e55a2D1266F9"
    );

    if (zoom >= 13) {
      const resp = await geocode(geometry, 0, 24, 1);
      const token = resp.tokens[0];

      let ret: string[];
      if (state.cellCache[token]) {
        ret = state.cellCache[token];
      } else {
        ret = await imovelRegistry.methods
          .registeredCells(packCell(resp.tokens[0]))
          .call();
        state.cellCache[token] = ret;
      }

      if (!ret) return;

      const cellIds = ret.map((c) => BigInt(c).toString(16).replace(/0+$/, ""));

      const multipoly = await getMultipolyForCells(cellIds);

      state.registeredFeatures = multipoly;
      //setMarkers([]);
    } else {
      const minLevel = zoom - 1;
      const resp = await geocode(geometry, minLevel, 24, 8);

      const counts: number[][] = [];
      const cellsToPlot: string[] = [];
      for (let idx in resp.tokens) {
        const token = resp.tokens[idx];

        if (state.locationCache[token]) {
          counts[idx] = state.locationCache[token];
        } else {
          const ret: number[] = await imovelRegistry.methods
            .registeredCellsPerQuad(packCell(token))
            .call();
          state.locationCache[token] = ret;
          counts[idx] = ret;
        }

        if (counts[idx].filter((c) => c > 0).length > 0) {
          cellsToPlot.push(token);
        }
      }

      const coordMap = await getCellQuadrants(cellsToPlot);

      //const markers: Cell[] = [];
      const polys: number[][][][] = [];
      for (let idx in resp.tokens) {
        for (let quad = 0; quad < 4; quad++) {
          if (counts[idx][quad] > 0) {
            //markers.push(coordMap[resp.tokens[idx]][quad]);
            polys.push(coordMap[resp.tokens[idx]][quad].poly);
          }
        }
      }

      //setMarkers(markers);
      state.registeredFeatures = {
        type: "MultiPolygon",
        coordinates: polys,
      };
    }

    await onFeaturesUpdated();
  }

  async function onMapIdle(evt: MapboxEvent) {
    await loadCells();
  }

  async function onFeaturesUpdated() {
    const features: GeoJSON.Feature[] = await Promise.all(
      Object.keys(geocodedFeatures).map(toFeature)
    );

    setCells({
      type: "FeatureCollection",
      features: features,
    });

    if (state.registeredFeatures) {
      setRegisteredCells({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              id: "reg",
            },
            geometry: state.registeredFeatures,
          },
        ],
      });
    } else {
      setRegisteredCells({
        type: "FeatureCollection",
        features: [],
      });
    }
  }

  async function onFeatureRegistered() {
    if (!selectedFeatureId) return;
    const selectedId = selectedFeatureId;
    drawControl.delete(selectedId);
    unselectFeature();
    state.cellCache = {};
    await loadCells();
    removeFeature(selectedId);
  }

  /**
   * Component Tree
   */

  return (
    <div className="map-page flex-fill">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -47.06546,
          latitude: -22.90457,
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
        <Source id="registered" type="geojson" data={registeredCells}>
          <Layer
            id="registered-layer"
            type="fill"
            paint={{ "fill-opacity": 0.3, "fill-color": "#00998c" }}
          />
        </Source>
        {markers.map((m) => (
          <Marker
            key={m.token}
            longitude={m.lng}
            latitude={m.lat}
            anchor="top"
          />
        ))}
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
      <DetailPanel
        show={showSidebar}
        feature={selectedFeature}
        onRegistered={onFeatureRegistered}
      />
    </div>
  );
}
