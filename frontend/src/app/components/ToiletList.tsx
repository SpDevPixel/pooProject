/*
 * 파일 위치: src/app/components/ToiletList.tsx
 * 상위 폴더: src/app/components (화면에서 재사용하는 컴포넌트)
 * 역할: 화장실 목록을 카드 형태로 보여주고 선택 상태를 표시합니다.
 */
import { Accessibility, Baby, Bell, Camera, MapPin } from "lucide-react";
import { Toilet } from "../types/toilet";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

interface ToiletListProps {
  toilets: Toilet[];
  selectedToilet: Toilet | null;
  onToiletClick: (toilet: Toilet) => void;
}

export function ToiletList({ toilets, selectedToilet, onToiletClick }: ToiletListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {toilets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>필터 조건에 맞는 화장실이 없습니다.</p>
          </div>
        ) : (
          toilets.map((toilet) => {
            const isSelected = selectedToilet?.id === toilet.id;

            return (
              <button
                key={toilet.id}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => onToiletClick(toilet)}
              >
                <div className="space-y-2">
                  {/* Title and badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium">{toilet.name}</h3>
                    <Badge
                      variant={toilet.isUserSubmitted ? "secondary" : "default"}
                      className="flex-shrink-0 text-xs"
                    >
                      {toilet.isUserSubmitted ? "사용자" : "공공"}
                    </Badge>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{toilet.roadAddress}</span>
                  </div>

                  {/* Opening hours */}
                  {toilet.openTime && (
                    <div className="text-sm text-muted-foreground">
                      {toilet.openTime}
                    </div>
                  )}

                  {/* Facilities icons */}
                  <div className="flex items-center gap-2 pt-1">
                    {toilet.hasDisabledFacility && (
                      <div className="p-1.5 rounded bg-blue-100">
                        <Accessibility size={14} className="text-blue-600" />
                      </div>
                    )}
                    {toilet.hasDiaperTable && (
                      <div className="p-1.5 rounded bg-pink-100">
                        <Baby size={14} className="text-pink-600" />
                      </div>
                    )}
                    {toilet.hasEmergencyBell && (
                      <div className="p-1.5 rounded bg-red-100">
                        <Bell size={14} className="text-red-600" />
                      </div>
                    )}
                    {toilet.hasEntranceCctv && (
                      <div className="p-1.5 rounded bg-purple-100">
                        <Camera size={14} className="text-purple-600" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}
