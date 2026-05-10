/*
 * 파일 위치: src/app/pages/ToiletListPage.tsx
 * 상위 폴더: src/app/pages (라우팅되는 페이지 화면)
 * 역할: 화장실을 이름과 주소로 검색하고 목록에서 상세 정보를 여는 화면입니다.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin, Search } from "lucide-react";
import { mockToilets } from "../data/mockToilets";
import type { Toilet } from "../types/toilet";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ToiletFilters } from "../components/ToiletFilters";
import { ToiletList } from "../components/ToiletList";
import { ToiletDetailModal } from "../components/ToiletDetailModal";

export default function ToiletListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [filters, setFilters] = useState({
    hasDisabledFacility: false,
    hasDiaperTable: false,
    hasEmergencyBell: false,
    hasEntranceCctv: false,
    isUserSubmitted: null as boolean | null,
  });

  const toilets = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return mockToilets.filter((toilet) => {
      if (filters.hasDisabledFacility && !toilet.hasDisabledFacility) return false;
      if (filters.hasDiaperTable && !toilet.hasDiaperTable) return false;
      if (filters.hasEmergencyBell && !toilet.hasEmergencyBell) return false;
      if (filters.hasEntranceCctv && !toilet.hasEntranceCctv) return false;
      if (filters.isUserSubmitted !== null && toilet.isUserSubmitted !== filters.isUserSubmitted) {
        return false;
      }
      if (!keyword) return true;
      return `${toilet.name} ${toilet.roadAddress}`.toLowerCase().includes(keyword);
    });
  }, [filters, query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft size={18} />
            홈으로
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-900">화장실 검색</h1>
            <p className="text-sm text-muted-foreground">{toilets.length}개의 결과</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-3">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Search size={17} />
              이름 또는 주소 검색
            </div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 강남역, 공원, 카페"
            />
          </div>
          <ToiletFilters filters={filters} onFiltersChange={setFilters} />
        </aside>

        <section className="min-h-[620px] rounded-lg border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 font-semibold">
              <MapPin size={18} className="text-blue-600" />
              검색 결과
            </div>
            <Button variant="outline" onClick={() => navigate("/register")}>
              새 화장실 등록
            </Button>
          </div>
          <ToiletList
            toilets={toilets}
            selectedToilet={selectedToilet}
            onToiletClick={setSelectedToilet}
          />
        </section>
      </main>

      <ToiletDetailModal
        toilet={selectedToilet}
        open={!!selectedToilet}
        onClose={() => setSelectedToilet(null)}
      />
    </div>
  );
}
