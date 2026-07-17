"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronUp,
  Home,
  LocateFixed,
  Search,
  X,
} from "lucide-react";

import { loadKakaoMap } from "@/lib/kakao-map";
import type {
  KClusterer,
  KCustomOverlay,
  KMap,
  KMarker,
  KMarkerImage,
  KakaoMaps,
} from "@/lib/kakao-types";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  REGION_ORDER,
  markerSize,
  markerSvg,
  type Place,
  type PlaceCategory,
} from "@/lib/places";
import { PlaceDetail } from "@/components/map/place-detail";

type Filter = PlaceCategory | "all";
type SheetState = "peek" | "half" | "full";

/** 기본 진입 위치 = 서울시청. 위치 동의 시 실제 위치로 이동한다. */
const SEOUL = { lat: 37.5665, lng: 126.978, level: 8 };
const LIST_CAP = 200;
const SHEET_PEEK = 96;
/** 위치 안내 팝업을 이미 보여줬는지 기억 */
const GEO_ASKED_KEY = "nadeulro_geo_asked";

/** 로딩 문구용 카테고리 라벨 */
function CATEGORY_LABEL(filter: Filter): string {
  return filter === "all" ? "전국 나들이 스팟을" : `${CATEGORIES[filter].label}을`;
}

type PlacesData = { places: Place[]; counts: Record<PlaceCategory, number> };

/**
 * 장소 데이터 모듈 캐시 — 카테고리 라우트를 오가며 MapScreen 이 리마운트돼도
 * 같은 세션에서는 /api/places 를 다시 받지 않는다.
 */
let placesCache: Promise<PlacesData> | null = null;

function loadPlacesOnce(): Promise<PlacesData> {
  if (!placesCache) {
    placesCache = fetch("/api/places")
      .then((r) =>
        r.ok ? (r.json() as Promise<PlacesData>) : Promise.reject(new Error(String(r.status)))
      )
      .catch((e) => {
        placesCache = null; // 실패는 캐시하지 않음 → 다음 진입 때 재시도
        throw e;
      });
  }
  return placesCache;
}

export function MapScreen({
  initialCategory,
  sideContent,
}: {
  initialCategory: Filter;
  sideContent?: React.ReactNode;
}) {
  /* ---------- 데이터 ---------- */
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [counts, setCounts] = useState<Record<PlaceCategory, number>>({
    parkgolf: 0,
    hotspring: 0,
    swim: 0,
    hiking: 0,
  });
  const [dataError, setDataError] = useState(false);

  /* ---------- 지도 ---------- */
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapsRef = useRef<KakaoMaps | null>(null);
  const mapRef = useRef<KMap | null>(null);
  const clustererRef = useRef<KClusterer | null>(null);
  const markersRef = useRef<Map<number, KMarker>>(new Map());
  const builtCatsRef = useRef<Set<PlaceCategory>>(new Set());
  const imageCacheRef = useRef<Map<string, KMarkerImage>>(new Map());
  const myOverlayRef = useRef<KCustomOverlay | null>(null);
  const autoLocatedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [firstPaint, setFirstPaint] = useState(false);
  const firstPaintRef = useRef(false);

  /* ---------- UI ---------- */
  const [filter, setFilter] = useState<Filter>(initialCategory);
  const [region, setRegion] = useState<string | null>(null); // null = 전체 지역
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [visible, setVisible] = useState<Place[]>([]);
  const [sheet, setSheet] = useState<SheetState>("peek");
  const [locating, setLocating] = useState(false);
  const [locPrompt, setLocPrompt] = useState(false);

  const filteredRef = useRef<Place[]>([]);
  const queryRef = useRef("");
  const selectedRef = useRef<number | null>(null);

  /* 내비게이션(헤더/탭)에서 다른 카테고리로 진입 시 동기화 (렌더 중 조정 패턴) */
  const [prevInitial, setPrevInitial] = useState<Filter>(initialCategory);
  if (prevInitial !== initialCategory) {
    setPrevInitial(initialCategory);
    setFilter(initialCategory);
    setSelectedId(null);
  }

  /* URL 동기화 — 카테고리 전용 경로 (히스토리 오염 없이) */
  useEffect(() => {
    const url = filter === "all" ? "/map" : CATEGORIES[filter].path;
    if (window.location.pathname !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [filter]);

  /* ---------- 데이터 로드 (세션 내 1회 — 카테고리 이동 시 재다운로드 방지) ---------- */
  useEffect(() => {
    let alive = true;
    loadPlacesOnce()
      .then((d) => {
        if (!alive) return;
        setPlaces(d.places);
        setCounts(d.counts);
      })
      .catch(() => alive && setDataError(true));
    return () => {
      alive = false;
    };
  }, []);

  /* ---------- 필터링 ---------- */
  const filtered = useMemo(() => {
    if (!places) return [];
    const q = query.trim().toLowerCase();
    return places.filter(
      (p) =>
        (filter === "all" || p.category === filter) &&
        (!region || p.region === region) &&
        (!q ||
          `${p.name} ${p.address ?? ""} ${p.region ?? ""} ${p.city ?? ""}`
            .toLowerCase()
            .includes(q))
    );
  }, [places, filter, region, query]);

  /* 현재 카테고리 기준 지역별 개수 */
  const regionCounts = useMemo(() => {
    const m = new Map<string, number>();
    if (places) {
      for (const p of places) {
        if (filter !== "all" && p.category !== filter) continue;
        if (!p.region) continue;
        m.set(p.region, (m.get(p.region) ?? 0) + 1);
      }
    }
    return m;
  }, [places, filter]);

  useEffect(() => {
    filteredRef.current = filtered;
    queryRef.current = query;
  }, [filtered, query]);

  /* 보이는 목록 재계산 (지도 영역 기준, 검색 중엔 전국) */
  const recomputeVisible = useCallback(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    const all = filteredRef.current;

    if (queryRef.current.trim() || !maps || !map) {
      setVisible(all.slice(0, LIST_CAP));
      return;
    }
    const bounds = map.getBounds();
    const center = map.getCenter();
    const clat = center.getLat();
    const clng = center.getLng();
    const inView = all.filter(
      (p) =>
        p.lat != null &&
        p.lng != null &&
        bounds.contain(new maps.LatLng(p.lat, p.lng))
    );
    inView.sort((a, b) => {
      const da = (a.lat! - clat) ** 2 + (a.lng! - clng) ** 2;
      const db = (b.lat! - clat) ** 2 + (b.lng! - clng) ** 2;
      return da - db;
    });
    setVisible(inView.slice(0, LIST_CAP));
  }, []);

  /* ---------- 지도 초기화 ---------- */
  useEffect(() => {
    let cancelled = false;
    loadKakaoMap()
      .then((rawMaps) => {
        if (cancelled || !containerRef.current) return;
        const maps = rawMaps as unknown as KakaoMaps;
        mapsRef.current = maps;

        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(SEOUL.lat, SEOUL.lng),
          level: SEOUL.level,
        });
        mapRef.current = map;

        clustererRef.current = new maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 8,
          disableClickZoom: false,
          gridSize: 72,
          calculator: [30, 100, 400],
          styles: [52, 60, 70, 82].map((s, i) => ({
            width: `${s}px`,
            height: `${s}px`,
            lineHeight: `${s}px`,
            textAlign: "center",
            borderRadius: "9999px",
            background: "rgba(44, 94, 66, 0.92)",
            border: "3px solid rgba(255,255,255,0.9)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            color: "#fff",
            fontWeight: "700",
            fontSize: `${15 + i}px`,
            cursor: "pointer",
          })),
        });

        maps.event.addListener(map, "idle", () => recomputeVisible());

        const ro = new ResizeObserver(() => map.relayout());
        ro.observe(containerRef.current);

        setMapReady(true);
      })
      .catch(() => !cancelled && setMapError(true));
    return () => {
      cancelled = true;
    };
  }, [recomputeVisible]);

  /* ---------- 마커 생성 (1회) ---------- */
  const markerImage = useCallback(
    (cat: PlaceCategory, selected: boolean): KMarkerImage => {
      const maps = mapsRef.current!;
      const key = `${cat}${selected ? "-s" : ""}`;
      const cached = imageCacheRef.current.get(key);
      if (cached) return cached;
      const { w, h } = markerSize(selected);
      const img = new maps.MarkerImage(
        markerSvg(cat, selected),
        new maps.Size(w, h),
        { offset: new maps.Point(w / 2, h) }
      );
      imageCacheRef.current.set(key, img);
      return img;
    },
    []
  );

  /* 필요한 카테고리의 마커만 지연 생성 (파크골프 진입 시 609개만) */
  const ensureMarkers = useCallback(
    (cats: PlaceCategory[]) => {
      const maps = mapsRef.current;
      if (!maps || !places) return;
      for (const cat of cats) {
        if (builtCatsRef.current.has(cat)) continue;
        for (const p of places) {
          if (p.category !== cat || p.lat == null || p.lng == null) continue;
          const marker = new maps.Marker({
            position: new maps.LatLng(p.lat, p.lng),
            image: markerImage(p.category, false),
            title: p.name,
            clickable: true,
          });
          maps.event.addListener(marker, "click", () => {
            setSelectedId(p.id);
            setSheet("half");
          });
          markersRef.current.set(p.id, marker);
        }
        builtCatsRef.current.add(cat);
      }
    },
    [places, markerImage]
  );

  /* ---------- 필터 → 클러스터 반영 ---------- */
  useEffect(() => {
    if (!places) return;
    /* 지도 로드 실패: 지도 없이 목록만 갱신 (recomputeVisible 이 무지도 폴백 처리) */
    if (mapError) {
      recomputeVisible();
      return;
    }
    if (!mapReady || !clustererRef.current) return;

    const apply = () => {
      ensureMarkers(filter === "all" ? CATEGORY_ORDER : [filter]);
      const clusterer = clustererRef.current;
      if (!clusterer) return;
      clusterer.clear();
      const active: KMarker[] = [];
      for (const p of filtered) {
        const m = markersRef.current.get(p.id);
        if (m) active.push(m);
      }
      clusterer.addMarkers(active);
      recomputeVisible();
      /* 선택된 곳이 필터 밖이면 해제 */
      if (
        selectedRef.current != null &&
        !filtered.some((p) => p.id === selectedRef.current)
      ) {
        setSelectedId(null);
      }
      if (!firstPaintRef.current) {
        firstPaintRef.current = true;
        setFirstPaint(true);
      }
    };

    /* 첫 렌더는 마커 생성이 무거우므로, 로딩 스피너를 먼저 그린 뒤 다음 틱에 생성한다 */
    if (!firstPaintRef.current) {
      const t = setTimeout(apply, 0);
      return () => clearTimeout(t);
    }
    apply();
  }, [filter, filtered, mapReady, mapError, places, ensureMarkers, recomputeVisible]);

  /* ---------- 지역 선택 시 해당 지역으로 지도 이동 ---------- */
  useEffect(() => {
    if (!region || !mapReady || !places) return;
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;
    const pts = places.filter(
      (p) =>
        p.region === region &&
        (filter === "all" || p.category === filter) &&
        p.lat != null &&
        p.lng != null
    );
    if (pts.length === 0) return;
    const bounds = new maps.LatLngBounds();
    for (const p of pts) bounds.extend(new maps.LatLng(p.lat!, p.lng!));
    map.setBounds(bounds);
  }, [region, filter, mapReady, places]);

  /* ---------- 선택 표시 ---------- */
  useEffect(() => {
    const prev = selectedRef.current;
    if (prev != null && prev !== selectedId) {
      const m = markersRef.current.get(prev);
      const p = places?.find((x) => x.id === prev);
      if (m && p) {
        m.setImage(markerImage(p.category, false));
        m.setZIndex(0);
      }
    }
    if (selectedId != null) {
      const m = markersRef.current.get(selectedId);
      const p = places?.find((x) => x.id === selectedId);
      if (m && p && mapsRef.current && mapRef.current) {
        m.setImage(markerImage(p.category, true));
        m.setZIndex(30);
        mapRef.current.panTo(new mapsRef.current.LatLng(p.lat!, p.lng!));
      }
    }
    selectedRef.current = selectedId;
  }, [selectedId, places, markerImage]);

  const selectPlace = useCallback((p: Place) => {
    setSelectedId(p.id);
    setSheet("half");
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (maps && map && p.lat != null && p.lng != null) {
      if (map.getLevel() > 7) map.setLevel(7);
      map.panTo(new maps.LatLng(p.lat, p.lng));
    }
  }, []);

  /* 내 위치 마커 표시 + 이동 (버튼·자동 진입 공용) */
  const showMyLocation = useCallback((lat: number, lng: number, level: number) => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;
    const ll = new maps.LatLng(lat, lng);
    myOverlayRef.current?.setMap(null);
    const overlay = new maps.CustomOverlay({
      position: ll,
      yAnchor: 0.5,
      zIndex: 40,
      content:
        '<div style="width:20px;height:20px;border-radius:50%;background:#2f6ee0;border:4px solid #fff;box-shadow:0 0 0 6px rgba(47,110,224,0.25),0 2px 8px rgba(0,0,0,0.3)"></div>',
    });
    overlay.setMap(map);
    myOverlayRef.current = overlay;
    map.setLevel(level);
    map.panTo(ll);
  }, []);

  /* 위치 요청 실행 (브라우저 기본 권한창을 띄운다) */
  const requestLocation = useCallback(
    (level: number) => {
      if (!navigator.geolocation) return;
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          showMyLocation(pos.coords.latitude, pos.coords.longitude, level);
          setLocating(false);
        },
        () => setLocating(false),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    },
    [showMyLocation]
  );

  /* ---------- 내 주변 (버튼) ---------- */
  const locateMe = useCallback(() => requestLocation(6), [requestLocation]);

  /* 안내 팝업 "허용" → 기억하고 위치 요청 */
  const allowLocation = useCallback(() => {
    try {
      localStorage.setItem(GEO_ASKED_KEY, "1");
    } catch {
      /* 프라이빗 모드 등 저장 실패 무시 */
    }
    setLocPrompt(false);
    requestLocation(7);
  }, [requestLocation]);

  /* 안내 팝업 "괜찮아요" → 기억하고 서울 뷰 유지 */
  const dismissLocation = useCallback(() => {
    try {
      localStorage.setItem(GEO_ASKED_KEY, "1");
    } catch {
      /* 무시 */
    }
    setLocPrompt(false);
  }, []);

  /* ---------- 진입 시: 이미 허용됨→바로 이동 / 미결정→안내 팝업 (1회) ---------- */
  useEffect(() => {
    if (!mapReady || autoLocatedRef.current) return;
    autoLocatedRef.current = true;
    if (!navigator.geolocation) return;

    let asked = false;
    try {
      asked = localStorage.getItem(GEO_ASKED_KEY) === "1";
    } catch {
      /* 무시 */
    }

    /* 권한 상태를 확인해 팝업 노출 여부 결정 (setState 는 async 경계 뒤에서) */
    const decide = async () => {
      const perms = navigator.permissions;
      let state: PermissionState | "unknown" = "unknown";
      if (perms?.query) {
        try {
          state = (await perms.query({ name: "geolocation" as PermissionName }))
            .state;
        } catch {
          state = "unknown";
        }
      }
      if (state === "granted")
        requestLocation(7); // 이미 허용 → 팝업 없이 바로
      else if (state !== "denied" && !asked) setLocPrompt(true);
      /* denied → 아무것도 안 함(서울 유지) */
    };
    void decide();
  }, [mapReady, requestLocation]);

  /* ---------- 모바일 시트 드래그 ---------- */
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);
  const [dragH, setDragH] = useState<number | null>(null);

  const sheetHeight = useCallback(
    (s: SheetState) => {
      const vh = typeof window === "undefined" ? 800 : window.innerHeight;
      if (s === "peek") return SHEET_PEEK;
      if (s === "half") return Math.round(vh * 0.44);
      return Math.round(vh * 0.8);
    },
    []
  );

  const onDragStart = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current = { startY: e.clientY, startH: sheetHeight(sheet) };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [sheet, sheetHeight]
  );
  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dy = dragRef.current.startY - e.clientY;
    const vh = window.innerHeight;
    setDragH(Math.max(SHEET_PEEK, Math.min(vh * 0.85, dragRef.current.startH + dy)));
  }, []);
  const onDragEnd = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragH((h) => {
      if (h != null) {
        const targets: Array<[SheetState, number]> = [
          ["peek", sheetHeight("peek")],
          ["half", sheetHeight("half")],
          ["full", sheetHeight("full")],
        ];
        targets.sort((a, b) => Math.abs(a[1] - h) - Math.abs(b[1] - h));
        setSheet(targets[0][0]);
      }
      return null;
    });
  }, [sheetHeight]);

  /* ---------- 파생 ---------- */
  const listSelected = useMemo(
    () => (selectedId != null ? places?.find((p) => p.id === selectedId) ?? null : null),
    [selectedId, places]
  );
  /* 선택 시 본문(description) 포함 전체 데이터를 지연 로딩 (목록엔 description 없음).
     캐시는 state Map — setState 는 async 콜백에서만 호출한다. */
  const [fullCache, setFullCache] = useState<Map<number, Place>>(() => new Map());
  useEffect(() => {
    if (selectedId == null || fullCache.has(selectedId)) return;
    let alive = true;
    fetch(`/api/place?id=${selectedId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((p: Place) => {
        if (!alive) return;
        setFullCache((prev) =>
          prev.has(p.id) ? prev : new Map(prev).set(p.id, p),
        );
      })
      .catch(() => {
        /* 실패 시 목록 데이터(설명 없음)로 표시 */
      });
    return () => {
      alive = false;
    };
  }, [selectedId, fullCache]);
  /* 본문 로딩 전엔 목록 데이터, 로딩되면 전체 데이터 */
  const selected =
    selectedId != null
      ? fullCache.get(selectedId) ?? listSelected
      : null;
  const total = counts.parkgolf + counts.hotspring + counts.swim + counts.hiking;
  /* 데이터 준비(=SDK 로드 + fetch + 첫 마커 렌더) 완료 전까지 로딩으로 본다 */
  const preparing = !mapError && !dataError && (!mapReady || !places || !firstPaint);
  const loading = preparing;

  const chips: Array<{ key: Filter; label: string; count: number; color?: string }> =
    useMemo(
      () => [
        { key: "all" as Filter, label: "전체", count: total },
        ...CATEGORY_ORDER.map((c) => ({
          key: c as Filter,
          label: CATEGORIES[c].short,
          count: counts[c],
          color: CATEGORIES[c].color,
        })),
      ],
      [counts, total]
    );

  /* ============================ 렌더 ============================ */
  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-50 flex bg-background md:top-16 md:bottom-0">
      {/* ---------- PC 사이드 패널 ---------- */}
      <aside className="hidden w-[404px] shrink-0 flex-col border-r bg-card md:flex">
        {selected ? (
          <PlaceDetail place={selected} onBack={() => setSelectedId(null)} />
        ) : (
          <>
            <div className="space-y-3 border-b px-4 pb-3 pt-4">
              <SearchBox query={query} onChange={setQuery} />
              <ChipRow chips={chips} filter={filter} onSelect={setFilter} />
              <RegionChips
                region={region}
                counts={regionCounts}
                onSelect={setRegion}
              />
            </div>
            <div className="flex items-baseline justify-between px-5 pb-1 pt-3">
              <p className="text-base font-semibold">
                {query.trim() ? "검색 결과" : region ? `${region} 지역` : "이 지역"}{" "}
                <span className="text-primary">{visible.length.toLocaleString()}곳</span>
              </p>
              {!query.trim() && (
                <p className="text-sm text-muted-foreground">지도를 움직여 보세요</p>
              )}
            </div>
            <PlaceList
              places={visible}
              loading={loading}
              dataError={dataError}
              onSelect={selectPlace}
            />
          </>
        )}
      </aside>

      {/* ---------- 지도 영역 ---------- */}
      <div className="relative flex-1">
        <div ref={containerRef} className="absolute inset-0" aria-label="나들이 지도" />

        {/* 모바일 상단 오버레이 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 space-y-2 p-3 md:hidden">
          <div className="pointer-events-auto flex items-center gap-2">
            <Link
              href="/"
              aria-label="홈으로"
              className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-card shadow-md"
            >
              <Home className="size-6 text-foreground/80" />
            </Link>
            <SearchBox query={query} onChange={setQuery} elevated />
          </div>
          <div className="pointer-events-auto">
            <ChipRow chips={chips} filter={filter} onSelect={setFilter} elevated />
          </div>
          <div className="pointer-events-auto">
            <RegionChips
              region={region}
              counts={regionCounts}
              onSelect={setRegion}
              elevated
            />
          </div>
        </div>

        {/* 내 주변 버튼 */}
        <button
          type="button"
          onClick={locateMe}
          aria-label="내 주변에서 찾기"
          className="absolute right-3 z-10 flex size-13 items-center justify-center rounded-full border bg-card shadow-lg transition-transform active:scale-95 md:bottom-6 md:right-5"
          style={{ bottom: `calc(${SHEET_PEEK}px + 0.9rem)` }}
        >
          <LocateFixed
            className={`size-6 ${locating ? "animate-pulse text-persimmon" : "text-primary"}`}
          />
        </button>

        {/* 지도 로드 실패 안내 */}
        {mapError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 p-6">
            <div className="max-w-md rounded-2xl border bg-card p-6 text-center shadow-lg">
              <p className="font-display text-xl font-bold">지도를 불러오지 못했어요</p>
              <p className="mt-2 break-keep text-base leading-relaxed text-muted-foreground">
                카카오맵은 등록된 주소에서만 열립니다. 아래 주소를 카카오 개발자
                콘솔의 <b>플랫폼 &gt; Web &gt; 사이트 도메인</b>에 등록해 주세요.
              </p>
              <code className="mt-3 inline-block rounded-lg bg-muted px-3 py-1.5 text-base font-semibold">
                {typeof window !== "undefined" ? window.location.origin : ""}
              </code>
              <p className="mt-3 text-sm text-muted-foreground">
                목록에서는 계속 찾아보실 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* 위치 권한 안내 팝업 (브라우저 기본창을 곧바로 띄우지 않고 먼저 물어본다) */}
        {locPrompt && !mapError && (
          <div
            className="fixed inset-0 z-[65] flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-[2px] sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="geo-title"
          >
            <div className="w-full max-w-sm rounded-3xl border bg-card p-6 text-center shadow-2xl">
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent">
                <LocateFixed className="size-8 text-primary" />
              </span>
              <p id="geo-title" className="font-display mt-4 text-2xl font-bold">
                내 주변부터 볼까요?
              </p>
              <p className="mt-2 break-keep text-base leading-relaxed text-muted-foreground">
                위치를 허용하면 지금 계신 곳 주변의 파크골프장·온천·수영장을 바로
                보여드려요. 허용하지 않으면 서울 지도로 시작합니다.
              </p>
              <div className="mt-6 grid gap-2.5">
                <button
                  type="button"
                  onClick={allowLocation}
                  className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-persimmon text-lg font-bold text-persimmon-foreground shadow-sm transition-transform active:scale-[0.98]"
                >
                  <LocateFixed className="size-5" />내 위치로 보기
                </button>
                <button
                  type="button"
                  onClick={dismissLocation}
                  className="flex min-h-13 items-center justify-center rounded-xl border-2 border-border bg-card text-lg font-semibold text-foreground/80 transition-colors hover:bg-muted"
                >
                  괜찮아요, 서울로 볼게요
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 데이터 로딩 오버레이 (SDK 로드 + fetch + 첫 마커 렌더) */}
        {preparing && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-background/55 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-4 rounded-3xl border bg-card/95 px-9 py-7 shadow-xl">
              <span className="relative flex size-12 items-center justify-center">
                <span className="absolute inline-flex size-12 animate-ping rounded-full bg-primary/25" />
                <span className="size-9 animate-spin rounded-full border-[3px] border-primary/25 border-t-primary" />
              </span>
              <p className="text-lg font-bold">
                {CATEGORY_LABEL(filter)} 불러오는 중…
              </p>
              <p className="-mt-1.5 text-base text-muted-foreground">
                잠시만 기다려 주세요
              </p>
            </div>
          </div>
        )}

        {/* ---------- 모바일 바텀 시트 ---------- */}
        <div
          ref={sheetRef}
          className="absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-3xl border-t bg-card shadow-[0_-8px_30px_rgba(0,0,0,0.14)] md:hidden"
          style={{
            height: dragH ?? sheetHeight(sheet),
            transition: dragH ? "none" : "height 0.28s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <div
            className="flex shrink-0 cursor-grab touch-none flex-col items-center pb-1 pt-2.5"
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
          >
            <div className="h-1.5 w-11 rounded-full bg-border" />
          </div>

          {selected ? (
            <PlaceDetail place={selected} onBack={() => setSelectedId(null)} />
          ) : (
            <>
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 pb-2"
                onClick={() => setSheet(sheet === "peek" ? "half" : "peek")}
              >
                <span className="text-lg font-bold">
                  {query.trim() ? "검색 결과" : region ? `${region} 지역` : "이 지역"}{" "}
                  <span className="text-primary">{visible.length.toLocaleString()}곳</span>
                </span>
                <ChevronUp
                  className={`size-6 text-muted-foreground transition-transform ${
                    sheet !== "peek" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {sheet !== "peek" && (
                <PlaceList
                  places={visible}
                  loading={loading}
                  dataError={dataError}
                  onSelect={selectPlace}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ---------- PC 우측 콘텐츠 패널 (xl+) ---------- */}
      {sideContent ? (
        <aside className="hidden w-[340px] shrink-0 flex-col overflow-y-auto border-l bg-card xl:flex">
          {sideContent}
        </aside>
      ) : null}
    </div>
  );
}

/* ================= 하위 컴포넌트 ================= */

function SearchBox({
  query,
  onChange,
  elevated = false,
}: {
  query: string;
  onChange: (v: string) => void;
  elevated?: boolean;
}) {
  return (
    <div className={`relative flex-1 ${elevated ? "drop-shadow-md" : ""}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="이름·지역 검색 (예: 온양)"
        className="h-12 w-full rounded-xl border bg-card pl-11 pr-10 text-base outline-none placeholder:text-muted-foreground/70 focus:border-primary"
        aria-label="장소 검색"
      />
      {query && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="검색어 지우기"
          className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  );
}

function ChipRow({
  chips,
  filter,
  onSelect,
  elevated = false,
}: {
  chips: Array<{ key: Filter; label: string; count: number; color?: string }>;
  filter: Filter;
  onSelect: (f: Filter) => void;
  elevated?: boolean;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="카테고리 필터"
    >
      {chips.map((c) => {
        const active = filter === c.key;
        const ready = c.count > 0 || c.key === "all";
        return (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(c.key)}
            className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-base font-semibold transition-colors ${
              active
                ? "border-transparent text-white"
                : `border-border bg-card text-foreground/85 hover:bg-muted ${elevated ? "shadow-md" : ""}`
            }`}
            style={active ? { backgroundColor: c.color ?? "var(--primary)" } : undefined}
          >
            {c.label}
            <span
              className={`text-sm font-bold ${active ? "text-white/85" : "text-muted-foreground"}`}
            >
              {ready ? c.count.toLocaleString() : "준비 중"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** 지역(시도) 필터 칩 — 전체 + 17개 시도 (개수 0인 지역은 흐리게·비활성) */
function RegionChips({
  region,
  counts,
  onSelect,
  elevated = false,
}: {
  region: string | null;
  counts: Map<string, number>;
  onSelect: (r: string | null) => void;
  elevated?: boolean;
}) {
  const chipCls = (active: boolean, disabled: boolean) =>
    `flex h-10 shrink-0 items-center gap-1 rounded-full border px-3.5 text-[15px] font-semibold transition-colors ${
      active
        ? "border-transparent bg-primary text-primary-foreground"
        : disabled
          ? "cursor-default border-border/60 bg-card text-muted-foreground/40"
          : `border-border bg-card text-foreground/80 hover:bg-muted ${elevated ? "shadow-md" : ""}`
    }`;

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="지역 필터"
    >
      <button
        type="button"
        role="tab"
        aria-selected={region === null}
        onClick={() => onSelect(null)}
        className={chipCls(region === null, false)}
      >
        전체 지역
      </button>
      {REGION_ORDER.map((r) => {
        const n = counts.get(r) ?? 0;
        const active = region === r;
        const disabled = n === 0;
        return (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => !disabled && onSelect(active ? null : r)}
            className={chipCls(active, disabled)}
          >
            {r}
            <span
              className={`text-xs font-bold ${active ? "text-primary-foreground/80" : "text-muted-foreground/70"}`}
            >
              {n.toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PlaceList({
  places,
  loading,
  dataError,
  onSelect,
}: {
  places: Place[];
  loading: boolean;
  dataError: boolean;
  onSelect: (p: Place) => void;
}) {
  if (loading) {
    return (
      <div className="flex-1 space-y-3 overflow-hidden px-4 pt-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }
  if (dataError) {
    return (
      <p className="flex-1 px-6 pt-8 text-center text-base text-muted-foreground">
        장소 정보를 불러오지 못했어요. 잠시 후 새로고침해 주세요.
      </p>
    );
  }
  if (places.length === 0) {
    return (
      <p className="flex-1 px-6 pt-8 text-center text-base text-muted-foreground">
        이 지역에는 아직 등록된 곳이 없어요.
        <br />
        지도를 움직이거나 다른 검색어로 찾아보세요.
      </p>
    );
  }
  return (
    <ul className="panel-scroll flex-1 divide-y overflow-y-auto pb-safe">
      {places.map((p) => (
        <PlaceRow key={p.id} place={p} onSelect={onSelect} />
      ))}
    </ul>
  );
}

function PlaceRow({
  place,
  onSelect,
}: {
  place: Place;
  onSelect: (p: Place) => void;
}) {
  const meta = CATEGORIES[place.category];
  const sub: string[] = [];
  if (place.region) sub.push([place.region, place.city].filter(Boolean).join(" "));
  if (place.category === "parkgolf" && place.attributes.holes)
    sub.push(`${place.attributes.holes}홀`);
  if (
    place.category === "hotspring" &&
    place.attributes.temp &&
    place.attributes.temp !== "-"
  )
    sub.push(`수온 ${place.attributes.temp}`);
  const thumb = place.attributes.image?.replace(/^http:\/\//, "https://");

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(place)}
        className="flex min-h-16 w-full items-center gap-3.5 px-5 py-3 text-left transition-colors hover:bg-muted/70 active:bg-muted"
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="size-12 shrink-0 rounded-xl border border-border/60 object-cover"
            style={{ boxShadow: `inset 0 0 0 2px ${meta.color}22` }}
          />
        ) : (
          <span
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold leading-snug">
            {place.name}
          </span>
          <span className="block truncate text-base text-muted-foreground">
            {sub.join(" · ")}
          </span>
        </span>
      </button>
    </li>
  );
}
