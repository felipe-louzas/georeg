import MapboxDraw, {
  DrawCreateEvent,
  DrawUpdateEvent,
  DrawDeleteEvent,
  DrawSelectionChangeEvent,
} from "@mapbox/mapbox-gl-draw";

import { MapRef, ControlPosition, useControl } from "react-map-gl";

import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position: ControlPosition;

  onCreate: (evt: DrawCreateEvent) => void;
  onUpdate: (evt: DrawUpdateEvent) => void;
  onDelete: (evt: DrawDeleteEvent) => void;
  onSelect: (evt: DrawSelectionChangeEvent) => void;
};

export default function DrawControl(props: DrawControlProps) {
  useControl<MapboxDraw>(
    () => new MapboxDraw(props),
    ({ map }: { map: MapRef }) => {
      map.on("draw.create", props.onCreate);
      map.on("draw.update", props.onUpdate);
      map.on("draw.delete", props.onDelete);
      map.on("draw.selectionchange", props.onSelect);
    },
    ({ map }: { map: MapRef }) => {
      map.off("draw.create", props.onCreate);
      map.off("draw.update", props.onUpdate);
      map.off("draw.delete", props.onDelete);
      map.off("draw.selectionchange", props.onSelect);
    },
    {
      position: props.position,
    }
  );

  return null;
}
