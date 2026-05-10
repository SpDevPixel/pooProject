import { Accessibility, Baby, Bell, Camera, Filter } from "lucide-react";
import { ToiletFilters as Filters } from "../types/toilet";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface ToiletFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function ToiletFilters({ filters, onFiltersChange }: ToiletFiltersProps) {
  const activeFilterCount = Object.values(filters).filter(
    (value) => value === true
  ).length;

  const handleToggle = (key: keyof Filters) => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const handleDataSourceChange = (value: string) => {
    onFiltersChange({
      ...filters,
      isUserSubmitted: value === "all" ? null : value === "user",
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      hasDisabledFacility: false,
      hasDiaperTable: false,
      hasEmergencyBell: false,
      hasEntranceCctv: false,
      isUserSubmitted: null,
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2" size={18} />
          필터
          {activeFilterCount > 0 && (
            <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>화장실 필터</SheetTitle>
          <SheetDescription>
            원하는 조건을 선택하여 화장실을 검색하세요
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 기본 시설 및 편의 */}
          <div className="space-y-4">
            <h3 className="font-medium">기본 시설 및 편의</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="disabled-facility" className="flex items-center gap-2 cursor-pointer">
                <Accessibility size={20} className="text-blue-600" />
                <span>장애인 시설</span>
              </Label>
              <Switch
                id="disabled-facility"
                checked={filters.hasDisabledFacility || false}
                onCheckedChange={() => handleToggle("hasDisabledFacility")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="diaper-table" className="flex items-center gap-2 cursor-pointer">
                <Baby size={20} className="text-pink-600" />
                <span>기저귀 교환대</span>
              </Label>
              <Switch
                id="diaper-table"
                checked={filters.hasDiaperTable || false}
                onCheckedChange={() => handleToggle("hasDiaperTable")}
              />
            </div>
          </div>

          {/* 비품 및 보안 */}
          <div className="space-y-4">
            <h3 className="font-medium">비품 및 보안</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="emergency-bell" className="flex items-center gap-2 cursor-pointer">
                <Bell size={20} className="text-red-600" />
                <span>비상벨</span>
              </Label>
              <Switch
                id="emergency-bell"
                checked={filters.hasEmergencyBell || false}
                onCheckedChange={() => handleToggle("hasEmergencyBell")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="entrance-cctv" className="flex items-center gap-2 cursor-pointer">
                <Camera size={20} className="text-purple-600" />
                <span>입구 CCTV</span>
              </Label>
              <Switch
                id="entrance-cctv"
                checked={filters.hasEntranceCctv || false}
                onCheckedChange={() => handleToggle("hasEntranceCctv")}
              />
            </div>
          </div>

          {/* 상태 및 신뢰도 */}
          <div className="space-y-4">
            <h3 className="font-medium">데이터 출처</h3>
            
            <RadioGroup
              value={
                filters.isUserSubmitted === null
                  ? "all"
                  : filters.isUserSubmitted
                  ? "user"
                  : "public"
              }
              onValueChange={handleDataSourceChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">전체</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="cursor-pointer">공공 데이터</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user" className="cursor-pointer">사용자 등록</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Clear button */}
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={clearFilters}
            >
              필터 초기화
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
