import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, MapPin, RefreshCw, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { searchKakaoLocations, type SearchLocation } from "../api/kakaoSearch";
import { fetchToilets } from "../api/toilets";
import type { Toilet } from "../types/toilet";
import { toast } from "sonner";

const getDistanceMeters = (from: SearchLocation, toilet: Toilet) => {
  if (typeof toilet.lat !== "number" || typeof toilet.lng !== "number") {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadius = 6371000;
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = (toilet.lat * Math.PI) / 180;
  const deltaLat = ((toilet.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((toilet.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distance: number) =>
  distance >= 1000 ? `약 ${(distance / 1000).toFixed(1)}km` : `약 ${Math.round(distance)}m`;

export default function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const initialQuery =
    ((location.state as { initialQuery?: string } | null)?.initialQuery ?? "").trim();
  const [query, setQuery] = useState(initialQuery);
  const [candidates, setCandidates] = useState<SearchLocation[]>([]);
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadToilets = async () => {
      try {
        const loadedToilets = await fetchToilets();
        if (isMounted) {
          setToilets(loadedToilets);
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadToilets();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const keyword = query.trim();
    if (!keyword) {
      setCandidates([]);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);

      try {
        const locations = await searchKakaoLocations(keyword);
        if (!isCancelled) {
          setCandidates(locations);
        }
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          setCandidates([]);
        }
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const applySearchLocation = (searchLocation: SearchLocation) => {
    navigate("/", {
      state: {
        searchQuery: query.trim() || searchLocation.label,
        searchLocation,
      },
    });
  };

  const nearbyToilets = useMemo(() => {
    const baseLocation = candidates[0];
    if (!baseLocation) return [];

    return toilets
      .map((toilet) => ({
        toilet,
        distance: getDistanceMeters(baseLocation, toilet),
      }))
      .filter(({ distance }) => Number.isFinite(distance))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [candidates, toilets]);

  const applyToiletLocation = (toilet: Toilet) => {
    if (typeof toilet.lat !== "number" || typeof toilet.lng !== "number") return;

    applySearchLocation({
      lat: toilet.lat,
      lng: toilet.lng,
      label: toilet.name,
      address: toilet.roadAddress,
      category: "화장실",
    });
  };

  const handleSubmit = async () => {
    const keyword = query.trim();
    if (!keyword) return;

    if (candidates[0]) {
      applySearchLocation(candidates[0]);
      return;
    }

    setIsSearching(true);

    try {
      const locations = await searchKakaoLocations(keyword);
      if (!locations[0]) {
        toast.error("검색한 위치를 찾지 못했습니다.");
        return;
      }

      applySearchLocation(locations[0]);
    } catch (error) {
      console.error(error);
      toast.error("검색에 실패했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <header className="border-b bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <ArrowLeft size={20} />
          </Button>
          <div className="relative min-w-0 flex-1">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder="장소, 역, 주소 검색"
              className="h-11 pl-9"
            />
          </div>
        </div>
      </header>

      <main className="px-4 py-4">
        <section className="rounded-lg border bg-white">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h1 className="text-sm font-semibold text-slate-900">위치 후보</h1>
            {isSearching && <RefreshCw size={16} className="animate-spin text-blue-600" />}
          </div>

          {!query.trim() ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              장소나 역 이름을 입력해주세요.
            </div>
          ) : candidates.length === 0 && !isSearching ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div>
              {candidates.map((candidate) => (
                <button
                  key={`${candidate.label}-${candidate.lat}-${candidate.lng}`}
                  type="button"
                  onClick={() => applySearchLocation(candidate)}
                  className="flex w-full items-start gap-3 border-b px-4 py-4 text-left last:border-b-0 hover:bg-blue-50"
                >
                  <MapPin size={18} className="mt-0.5 shrink-0 text-blue-600" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium text-slate-950">{candidate.label}</span>
                      {candidate.isSubwayStation && (
                        <span className="shrink-0 rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                          지하철역
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">
                      {candidate.address || candidate.category || "위치 정보"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {nearbyToilets.length > 0 && (
          <section className="mt-4 rounded-lg border bg-white">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">근처 화장실</h2>
            </div>
            <div>
              {nearbyToilets.map(({ toilet, distance }) => (
                <button
                  key={toilet.managementNo}
                  type="button"
                  onClick={() => applyToiletLocation(toilet)}
                  className="flex w-full items-start gap-3 border-b px-4 py-4 text-left last:border-b-0 hover:bg-blue-50"
                >
                  <Search size={18} className="mt-0.5 shrink-0 text-blue-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-950">{toilet.name}</span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">
                      {toilet.roadAddress || "주소 정보 없음"}
                    </span>
                    <span className="mt-1 block text-sm font-medium text-blue-600">
                      {formatDistance(distance)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
