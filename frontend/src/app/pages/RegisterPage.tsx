/*
 * 파일 위치: src/app/pages/RegisterPage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 사용자가 새 화장실 위치와 정보를 등록하는 화면입니다.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import type { ToiletFormData } from "../types/toilet";
import { createUserToilet } from "../api/toilets";
import { useAuth } from "../contexts/AuthContext";

// ──────────────────────────────────────────────
// 카카오 REST API로 역지오코딩 (fetch 방식)
// .env → VITE_KAKAO_REST_KEY 에 REST API 키 저장
// ──────────────────────────────────────────────
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY;

  if (!REST_KEY) {
    throw new Error("주소 자동 입력 설정이 없어 주소를 불러오지 못했습니다. 주소를 직접 입력해주세요.");
  }

  const response = await fetch(
    `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
    {
      headers: {
        Authorization: `KakaoAK ${REST_KEY}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("주소 자동 입력 권한이 없어 주소를 불러오지 못했습니다. 주소를 직접 입력해주세요.");
    }

    if (response.status === 429) {
      throw new Error("주소 자동 입력 요청이 많습니다. 잠시 후 다시 시도하거나 주소를 직접 입력해주세요.");
    }

    throw new Error("주소 자동 입력을 할 수 없습니다. 주소를 직접 입력해주세요.");
  }

  const data = await response.json();

  if (!data.documents || data.documents.length === 0) {
    throw new Error("선택한 위치의 주소를 찾지 못했습니다. 주소를 직접 입력해주세요.");
  }

  // 도로명 주소 우선, 없으면 지번 주소
  const address =
    data.documents[0].road_address?.address_name ||
    data.documents[0].address?.address_name ||
    "";

  return address;
};

const geocodeAddress = async (
  roadAddress: string
): Promise<{ lat: number; lng: number }> => {
  const REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY;

  if (!REST_KEY) {
    throw new Error("좌표 변환 설정이 없습니다.");
  }

  const response = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(roadAddress)}`,
    {
      headers: {
        Authorization: `KakaoAK ${REST_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("주소를 좌표로 변환하지 못했습니다.");
  }

  const data = await response.json();
  const firstDocument = data.documents?.[0];

  if (!firstDocument?.x || !firstDocument?.y) {
    throw new Error("주소에 맞는 좌표를 찾지 못했습니다.");
  }

  return {
    lat: Number(firstDocument.y),
    lng: Number(firstDocument.x),
  };
};

// ──────────────────────────────────────────────
// RegisterPage 컴포넌트
// ──────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // 지도 관련 ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [formData, setFormData] = useState<ToiletFormData>({
    name: "",
    roadAddress: "",
    lat: 37.5665,   // 초기값: 서울시청
    lng: 126.9780,
    openTime: "",
    openTimeDetail: "",
    managingOrg: "",
    phoneNumber: "",
    wasteDisposal: "",
    hasDisabledFacility: false,
    hasDiaperTable: false,
    hasEmergencyBell: false,
    hasEntranceCctv: false,
  });

  // ──────────────────────────────────────────
  // 카카오맵 SDK 초기화 (마운트 시 1회)
  // index.html에 SDK 스크립트가 로드돼 있어야 함
  // ──────────────────────────────────────────
  useEffect(() => {
    const initMap = () => {
      if (!mapContainerRef.current || !window.kakao?.maps) return;

      window.kakao.maps.load(() => {
        const center = new window.kakao.maps.LatLng(formData.lat, formData.lng);

        const map = new window.kakao.maps.Map(mapContainerRef.current, {
          center,
          level: 4,
        });

        // 초기 마커 생성
        const marker = new window.kakao.maps.Marker({ position: center });
        marker.setMap(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;
        setMapLoaded(true);

        // 지도 클릭 이벤트 등록
        window.kakao.maps.event.addListener(
          map,
          "click",
          async (mouseEvent: any) => {
            // isSelectingLocation은 클릭 시점의 최신 값을 읽기 위해
            // setIsSelectingLocation의 콜백 패턴 대신 ref 사용
            setIsSelectingLocation((prev) => {
              if (!prev) return prev; // 선택 모드가 아니면 무시
              return prev;
            });

            handleMapClickOnKakao(mouseEvent.latLng);
          }
        );
      });
    };

    // SDK가 이미 로드된 경우와 아직 로드 중인 경우 모두 대응
    if (window.kakao?.maps) {
      initMap();
    } else {
      // SDK 스크립트 onload 이벤트 대기
      const script = document.querySelector(
        'script[src*="dapi.kakao.com"]'
      ) as HTMLScriptElement | null;

      if (script) {
        script.addEventListener("load", initMap);
        return () => script.removeEventListener("load", initMap);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ──────────────────────────────────────────
  // 지도 클릭 핸들러 (카카오 LatLng 객체 수신)
  // ──────────────────────────────────────────
  const handleMapClickOnKakao = async (latLng: any) => {
    // 선택 모드 상태를 최신값으로 확인
    // (클로저 문제를 피하기 위해 isSelectingLocationRef 사용)
    if (!isSelectingLocationRef.current) return;

    const lat = latLng.getLat();
    const lng = latLng.getLng();

    // 마커 이동
    const newPosition = new window.kakao.maps.LatLng(lat, lng);
    markerRef.current?.setPosition(newPosition);
    mapInstanceRef.current?.panTo(newPosition);

    setFormData((prev) => ({ ...prev, lat, lng }));
    setHasSelectedLocation(true);
    setIsSelectingLocation(false);

    // 역지오코딩으로 주소 자동 입력
    setIsLoadingAddress(true);
    try {
      const address = await reverseGeocode(lat, lng);
      setFormData((prev) => ({ ...prev, roadAddress: address }));
      toast.success("위치와 주소가 자동으로 입력되었습니다");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "주소를 불러오지 못했습니다. 주소를 직접 입력해주세요."
      );
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // isSelectingLocation의 최신값을 클로저 밖에서 읽기 위한 ref
  const isSelectingLocationRef = useRef(isSelectingLocation);
  useEffect(() => {
    isSelectingLocationRef.current = isSelectingLocation;
  }, [isSelectingLocation]);

  // 지도 커서 스타일: 선택 모드일 때 crosshair
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const container = mapContainerRef.current;
    if (!container) return;
    container.style.cursor = isSelectingLocation ? "crosshair" : "grab";
  }, [isSelectingLocation]);

  // ──────────────────────────────────────────
  // 폼 제출
  // ──────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.roadAddress) {
      toast.error("필수 항목을 입력해주세요");
      return;
    }

    if (!isAuthenticated || !user?.token) {
      toast.error("로그인 후 화장실을 등록할 수 있습니다.");
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      let coordinates = {
        lat: formData.lat,
        lng: formData.lng,
      };

      try {
        coordinates = await geocodeAddress(formData.roadAddress);
      } catch (error) {
        if (!hasSelectedLocation) {
          throw error;
        }
      }

      await createUserToilet(
        {
          managementNo: `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: formData.name,
          roadAddress: formData.roadAddress,
          lat: coordinates.lat,
          lng: coordinates.lng,
          openTime: formData.openTime || null,
          openTimeDetail: formData.openTimeDetail || null,
          managingOrg: formData.managingOrg || null,
          phoneNumber: formData.phoneNumber || null,
          wasteDisposal: formData.wasteDisposal || null,
          hasDisabledFacility: formData.hasDisabledFacility,
          hasEmergencyBell: formData.hasEmergencyBell,
          hasDiaperTable: formData.hasDiaperTable,
          hasEntranceCctv: formData.hasEntranceCctv,
          isUserSubmitted: true,
        },
        user.token
      );

      toast.success("화장실 정보가 등록되었습니다!");
      setTimeout(() => navigate("/"), 700);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "등록에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ──────────────────────────────────────────
  // 렌더링
  // ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-semibold">화장실 등록</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">

          {/* ── 왼쪽: 폼 ── */}
          <div className="bg-white rounded-lg border p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* 기본 정보 */}
              <div className="space-y-4">
                <h2 className="font-medium">기본 정보</h2>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    화장실 명칭 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="예: OO빌딩 O층 화장실"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    도로명 주소 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="지도를 클릭하거나 직접 입력하세요"
                    value={formData.roadAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, roadAddress: e.target.value })
                    }
                    disabled={isLoadingAddress}
                    required
                  />
                  {isLoadingAddress && (
                    <p className="text-xs text-blue-600">주소를 가져오는 중...</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    위치 <span className="text-red-500">*</span>
                  </Label>
                  <div>
                    <Button
                      type="button"
                      variant={isSelectingLocation ? "default" : "outline"}
                      onClick={() => setIsSelectingLocation((v) => !v)}
                    >
                      <MapPin size={16} className="mr-2" />
                      {isSelectingLocation ? "선택 중..." : "지도 선택"}
                    </Button>
                  </div>
                  {isSelectingLocation && (
                    <p className="text-xs text-blue-600 font-medium">
                      오른쪽 지도를 클릭하여 위치를 선택하세요
                    </p>
                  )}
                </div>
              </div>

              {/* 운영 정보 */}
              <div className="space-y-4">
                <h2 className="font-medium">운영 정보</h2>

                <div className="space-y-2">
                  <Label htmlFor="openTime">운영 시간</Label>
                  <Input
                    id="openTime"
                    placeholder="예: 24시간, 09:00-18:00"
                    value={formData.openTime}
                    onChange={(e) =>
                      setFormData({ ...formData, openTime: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openTimeDetail">운영 시간 상세</Label>
                  <Textarea
                    id="openTimeDetail"
                    placeholder="예: 연중무휴, 주말 휴무 등"
                    value={formData.openTimeDetail}
                    onChange={(e) =>
                      setFormData({ ...formData, openTimeDetail: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managingOrg">관리기관</Label>
                  <Input
                    id="managingOrg"
                    placeholder="예: 서울시 강남구청"
                    value={formData.managingOrg}
                    onChange={(e) =>
                      setFormData({ ...formData, managingOrg: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">관리기관 연락처</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="예: 02-1234-5678"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wasteDisposal">화장실 방식</Label>
                  <Input
                    id="wasteDisposal"
                    placeholder="예: 수세식, 푸세식 등"
                    value={formData.wasteDisposal}
                    onChange={(e) =>
                      setFormData({ ...formData, wasteDisposal: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* 시설 특징 */}
              <div className="space-y-4">
                <h2 className="font-medium">시설 특징</h2>

                <div className="space-y-3">
                  {[
                    {
                      id: "disabled",
                      label: "장애인 시설",
                      key: "hasDisabledFacility" as const,
                    },
                    {
                      id: "diaper",
                      label: "기저귀 교환대",
                      key: "hasDiaperTable" as const,
                    },
                    {
                      id: "bell",
                      label: "비상벨",
                      key: "hasEmergencyBell" as const,
                    },
                    {
                      id: "cctv",
                      label: "입구 CCTV",
                      key: "hasEntranceCctv" as const,
                    },
                  ].map(({ id, label, key }) => (
                    <div key={id} className="flex items-center justify-between">
                      <Label htmlFor={id} className="cursor-pointer">
                        {label}
                      </Label>
                      <Switch
                        id={id}
                        checked={formData[key] as boolean}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, [key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "등록 중..." : "등록하기"}
              </Button>
            </form>
          </div>

          {/* ── 오른쪽: 카카오맵 ── */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">위치 미리보기</h2>
              {isSelectingLocation && (
                <span className="text-xs text-blue-600 font-medium animate-pulse">
                  지도를 클릭해 위치를 선택하세요
                </span>
              )}
            </div>

            {/* 카카오맵 컨테이너 */}
            <div
              ref={mapContainerRef}
              className={`w-full rounded-lg overflow-hidden transition-shadow ${
                isSelectingLocation
                  ? "ring-2 ring-blue-500 shadow-md"
                  : "ring-1 ring-gray-200"
              }`}
              style={{ height: "600px" }}
            />

            {/* SDK 로드 전 fallback */}
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
                <p className="text-sm text-muted-foreground">지도 로딩 중...</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3">
              마커를 정확히 배치하려면 <strong>"지도 선택"</strong> 버튼을 누른 뒤 지도를 클릭하세요.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
