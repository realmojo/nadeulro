/**
 * 카카오맵 JS SDK 최소 타입 — 나들로에서 쓰는 것만 실용적으로 정의.
 * (공식 타입 패키지 없이 안전하게 쓰기 위한 얇은 계층)
 */

export type KLatLng = {
  getLat(): number;
  getLng(): number;
};

export type KLatLngBounds = {
  contain(latlng: KLatLng): boolean;
  extend(latlng: KLatLng): void;
};

export type KSize = unknown;
export type KPoint = unknown;
export type KMarkerImage = unknown;

export type KMap = {
  setCenter(latlng: KLatLng): void;
  panTo(latlng: KLatLng): void;
  getCenter(): KLatLng;
  getBounds(): KLatLngBounds;
  setLevel(level: number, options?: { anchor?: KLatLng }): void;
  getLevel(): number;
  setBounds(bounds: KLatLngBounds): void;
  relayout(): void;
  addControl(control: unknown, position: unknown): void;
};

export type KMarker = {
  setMap(map: KMap | null): void;
  setImage(image: KMarkerImage): void;
  setZIndex(z: number): void;
  getPosition(): KLatLng;
};

export type KClusterer = {
  addMarkers(markers: KMarker[]): void;
  removeMarkers(markers: KMarker[]): void;
  clear(): void;
  redraw(): void;
};

export type KCustomOverlay = {
  setMap(map: KMap | null): void;
  setPosition(latlng: KLatLng): void;
};

export type KakaoMaps = {
  LatLng: new (lat: number, lng: number) => KLatLng;
  LatLngBounds: new () => KLatLngBounds;
  Map: new (
    el: HTMLElement,
    options: { center: KLatLng; level: number }
  ) => KMap;
  Marker: new (options: {
    position: KLatLng;
    image?: KMarkerImage;
    title?: string;
    clickable?: boolean;
    zIndex?: number;
  }) => KMarker;
  MarkerImage: new (
    src: string,
    size: KSize,
    options?: { offset?: KPoint }
  ) => KMarkerImage;
  Size: new (width: number, height: number) => KSize;
  Point: new (x: number, y: number) => KPoint;
  MarkerClusterer: new (options: {
    map: KMap;
    averageCenter?: boolean;
    minLevel?: number;
    disableClickZoom?: boolean;
    gridSize?: number;
    calculator?: number[];
    styles?: Array<Record<string, string>>;
  }) => KClusterer;
  CustomOverlay: new (options: {
    position: KLatLng;
    content: string | HTMLElement;
    yAnchor?: number;
    zIndex?: number;
  }) => KCustomOverlay;
  ZoomControl: new () => unknown;
  ControlPosition: Record<string, unknown>;
  event: {
    addListener(
      target: unknown,
      type: string,
      handler: (...args: unknown[]) => void
    ): void;
  };
};
