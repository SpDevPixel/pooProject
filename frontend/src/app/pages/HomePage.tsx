/*
 * 파일 위치: src/app/pages/HomePage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 메인 화면입니다. 화장실 목록을 불러오고 지도, 필터, 주요 이동 버튼을 보여줍니다.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  Heart,
  ListFilter,
  Megaphone,
  Navigation,
  Plus,
  RefreshCw,
  Search,
  Shield,
  User,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ToiletFilters } from "../components/ToiletFilters";
import { ToiletDetailModal } from "../components/ToiletDetailModal";
import { NavigationDialog } from "../components/NavigationDialog";
import { MapView } from "../components/MapView";
import { fetchToilets } from "../api/toilets";
import { mockToilets } from "../data/mockToilets";
import type { Toilet, ToiletFilters as Filters } from "../types/toilet";
import { useAuth } from "../contexts/AuthContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [isLoadingToilets, setIsLoadingToilets] = useState(true);
  const [toiletLoadError, setToiletLoadError] = useState<string | null>(null);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNavigationDialogOpen, setIsNavigationDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    hasDisabledFacility: false,
    hasDiaperTable: false,
    hasEmergencyBell: false,
    hasEntranceCctv: false,
    isUserSubmitted: null,
  });

  const loadToilets = useCallback(async () => {
    setIsLoadingToilets(true);
    setToiletLoadError(null);

    try {
      const loadedToilets = await fetchToilets();
      setToilets(loadedToilets);
    } catch (error) {
      console.error(error);
      setToilets(mockToilets);
      setToiletLoadError(
        "백엔드 연결 전이라 샘플 데이터로 화면을 표시하고 있습니다."
      );
    } finally {
      setIsLoadingToilets(false);
    }
  }, []);

  useEffect(() => {
    loadToilets();
  }, [loadToilets]);

  const filteredToilets = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return toilets.filter((toilet) => {
      if (filters.hasDisabledFacility && !toilet.hasDisabledFacility) return false;
      if (filters.hasDiaperTable && !toilet.hasDiaperTable) return false;
      if (filters.hasEmergencyBell && !toilet.hasEmergencyBell) return false;
      if (filters.hasEntranceCctv && !toilet.hasEntranceCctv) return false;
      if (filters.isUserSubmitted !== null && toilet.isUserSubmitted !== filters.isUserSubmitted) {
        return false;
      }
      if (keyword && !`${toilet.name} ${toilet.roadAddress}`.toLowerCase().includes(keyword)) {
        return false;
      }
      return true;
    });
  }, [filters, searchQuery, toilets]);

  const handleToiletClick = useCallback((toilet: Toilet) => {
    setSelectedToilet(toilet);
    setIsDetailModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-4 py-4 flex-shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">화장실 급할 때</h1>
            <p className="text-sm text-muted-foreground">
              {isLoadingToilets
                ? "화장실 데이터를 불러오는 중입니다."
                : `${filteredToilets.length}개의 화장실을 찾았습니다.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {toiletLoadError && (
              <Button variant="outline" onClick={loadToilets} className="flex items-center gap-2">
                <RefreshCw size={18} />
                다시 불러오기
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/notices")} className="flex items-center gap-2">
              <Megaphone size={18} />
              공지사항
            </Button>
            <Button variant="outline" onClick={() => navigate("/toilets")} className="flex items-center gap-2">
              <ListFilter size={18} />
              검색
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin")} className="flex items-center gap-2">
              <Shield size={18} />
              관리자
            </Button>
            <ToiletFilters filters={filters} onFiltersChange={setFilters} />
            {isAuthenticated ? (
              <Button
                variant="outline"
                onClick={() => navigate("/mypage")}
                className="flex items-center gap-2"
              >
                <User size={18} />
                마이페이지
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="flex items-center gap-2"
              >
                <User size={18} />
                로그인
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto lg:overflow-hidden">
        <div className="max-w-7xl mx-auto h-full p-4">
          {toiletLoadError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertCircle size={18} />
              {toiletLoadError}
            </div>
          )}
          <div className="grid lg:grid-cols-4 gap-4 lg:h-full">
            <div className="lg:col-span-1 space-y-3">
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Search size={17} />
                  빠른 검색
                </label>
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="화장실 이름 또는 주소"
                />
              </div>
              <ActionButton
                icon={Navigation}
                label="길찾기"
                description="가까운 화장실로 경로 안내"
                color="blue"
                onClick={() => setIsNavigationDialogOpen(true)}
              />
              <ActionButton
                icon={Plus}
                label="새 화장실 등록"
                description="화장실 정보 공유하기"
                color="green"
                onClick={() => navigate("/register")}
              />
              <ActionButton
                icon={Heart}
                label="즐겨찾기"
                description="저장한 화장실 보기"
                color="purple"
                onClick={() => navigate("/favorites")}
              />
              <ActionButton
                icon={Megaphone}
                label="공지사항"
                description="서비스 소식 확인하기"
                color="yellow"
                onClick={() => navigate("/notices")}
              />
            </div>

            <div className="lg:col-span-3 h-[600px] lg:h-full">
              <MapView
                toilets={filteredToilets}
                selectedToilet={selectedToilet}
                onMarkerClick={handleToiletClick}
              />
            </div>
          </div>
        </div>
      </div>

      <ToiletDetailModal
        toilet={selectedToilet}
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />

      <NavigationDialog
        open={isNavigationDialogOpen}
        onClose={() => setIsNavigationDialogOpen(false)}
        toilets={filteredToilets}
      />
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  description: string;
  color: "blue" | "yellow" | "green" | "purple";
  onClick: () => void;
}

function ActionButton({
  icon: Icon,
  label,
  description,
  color,
  onClick,
}: ActionButtonProps) {
  const colorClasses = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-white",
    green: "bg-green-600 hover:bg-green-700 text-white",
    purple: "bg-purple-600 hover:bg-purple-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-6 rounded-lg ${colorClasses[color]} transition-all hover:shadow-lg text-left`}
    >
      <div className="flex flex-col items-start gap-2">
        <Icon size={32} className="mb-2" />
        <h3 className="font-bold text-lg">{label}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </button>
  );
}
