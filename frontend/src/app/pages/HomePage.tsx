import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Navigation, Plus, Star, Filter, Heart, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { ToiletFilters } from "../components/ToiletFilters";
import { ToiletDetailModal } from "../components/ToiletDetailModal";
import { NavigationDialog } from "../components/NavigationDialog";
import { MapView } from "../components/MapView";
import { mockToilets } from "../data/mockToilets";
import { Toilet, ToiletFilters as Filters } from "../types/toilet";
import { useAuth } from "../contexts/AuthContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNavigationDialogOpen, setIsNavigationDialogOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    hasDisabledFacility: false,
    hasDiaperTable: false,
    hasEmergencyBell: false,
    hasEntranceCctv: false,
    isUserSubmitted: null,
  });

  // Filter toilets based on active filters
  const filteredToilets = useMemo(() => {
    return mockToilets.filter((toilet) => {
      if (filters.hasDisabledFacility && !toilet.hasDisabledFacility) return false;
      if (filters.hasDiaperTable && !toilet.hasDiaperTable) return false;
      if (filters.hasEmergencyBell && !toilet.hasEmergencyBell) return false;
      if (filters.hasEntranceCctv && !toilet.hasEntranceCctv) return false;
      if (filters.isUserSubmitted !== null && toilet.isUserSubmitted !== filters.isUserSubmitted)
        return false;
      return true;
    });
  }, [filters]);

  const handleToiletClick = (toilet: Toilet) => {
    setSelectedToilet(toilet);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex-shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">화장실 급할 때</h1>
            <p className="text-sm text-muted-foreground">
              {filteredToilets.length}개의 화장실을 찾았습니다
            </p>
          </div>
          <div className="flex items-center gap-2">
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden">
        <div className="max-w-7xl mx-auto h-full p-4">
          <div className="grid lg:grid-cols-4 gap-4 lg:h-full">
            {/* Left Sidebar - Action Buttons */}
            <div className="lg:col-span-1 space-y-3">
              <ActionButton
                icon={Navigation}
                label="길찾기"
                description="가까운 화장실로 경로 안내"
                color="blue"
                onClick={() => setIsNavigationDialogOpen(true)}
              />
              <ActionButton
                icon={Plus}
                label="새로운 화장실 등록"
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
            </div>

            {/* Right - Map View */}
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

      {/* Modals */}
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

// Action Button Component
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