/*
 * 파일 위치: src/app/components/ToiletFilters.tsx
 * 상위 폴더: src/app/components (화면에서 재사용하는 컴포넌트)
 * 역할: 화장실 검색 결과를 편의시설과 등록 유형으로 필터링하는 UI입니다.
 */
import { Accessibility, Baby, Bell, Camera, Database, Filter, Sparkles } from "lucide-react";
import type { ToiletFilters as Filters } from "../types/toilet";
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
import { cn } from "./ui/utils";

interface ToiletFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  triggerClassName?: string;
}

export function ToiletFilters({ filters, onFiltersChange, triggerClassName }: ToiletFiltersProps) {
  const activeFilterCount =
    Object.entries(filters).filter(([key, value]) =>
      key === "isUserSubmitted" ? value !== null : value === true
    ).length;

  const facilityFilters = [
    {
      key: "hasDisabledFacility" as const,
      label: "장애인 시설",
      description: "편의시설이 있는 곳만 보기",
      icon: Accessibility,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      key: "hasDiaperTable" as const,
      label: "기저귀 교환대",
      description: "영유아 동반 이용에 편한 곳",
      icon: Baby,
      iconClassName: "bg-pink-50 text-pink-600",
    },
  ];

  const safetyFilters = [
    {
      key: "hasEmergencyBell" as const,
      label: "비상벨",
      description: "위급 상황 대응 시설 포함",
      icon: Bell,
      iconClassName: "bg-red-50 text-red-600",
    },
    {
      key: "hasEntranceCctv" as const,
      label: "입구 CCTV",
      description: "출입구 보안 정보 포함",
      icon: Camera,
      iconClassName: "bg-purple-50 text-purple-600",
    },
  ];

  const dataSources = [
    { value: "all", label: "전체", description: "모든 화장실 보기" },
    { value: "public", label: "공공 데이터", description: "서울시 공공 데이터만" },
    { value: "user", label: "사용자 등록", description: "사용자가 추가한 장소만" },
  ];

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
        <Button variant="outline" className={`relative ${triggerClassName ?? ""}`}>
          <Filter className="mr-2" size={18} />
          필터
          {activeFilterCount > 0 && (
            <Badge className="ml-2 h-5 w-5 rounded-full border-0 bg-blue-600 p-0 text-white flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-[390px] gap-0 overflow-y-auto border-l border-blue-100 bg-gray-50 p-0 sm:max-w-[390px]">
        <SheetHeader className="border-b border-blue-100 bg-white px-5 pb-5 pt-6">
          <div className="flex size-11 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Filter size={22} />
          </div>
          <SheetTitle className="text-xl font-bold text-slate-950">화장실 필터</SheetTitle>
          <SheetDescription className="text-sm leading-5 text-slate-500">
            필요한 시설과 데이터 출처를 골라 더 빠르게 찾으세요
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 py-5">
          <FilterSection title="기본 시설 및 편의" icon={Sparkles}>
            {facilityFilters.map((item) => (
              <FilterToggle
                key={item.key}
                checked={Boolean(filters[item.key])}
                description={item.description}
                icon={item.icon}
                iconClassName={item.iconClassName}
                id={item.key}
                label={item.label}
                onCheckedChange={() => handleToggle(item.key)}
              />
            ))}
          </FilterSection>

          <FilterSection title="비품 및 보안" icon={Bell}>
            {safetyFilters.map((item) => (
              <FilterToggle
                key={item.key}
                checked={Boolean(filters[item.key])}
                description={item.description}
                icon={item.icon}
                iconClassName={item.iconClassName}
                id={item.key}
                label={item.label}
                onCheckedChange={() => handleToggle(item.key)}
              />
            ))}
          </FilterSection>

          <FilterSection title="데이터 출처" icon={Database}>
            <RadioGroup
              value={
                filters.isUserSubmitted === null
                  ? "all"
                  : filters.isUserSubmitted
                  ? "user"
                  : "public"
              }
              onValueChange={handleDataSourceChange}
              className="gap-2"
            >
              {dataSources.map((source) => {
                const isSelected =
                  filters.isUserSubmitted === null
                    ? source.value === "all"
                    : filters.isUserSubmitted
                    ? source.value === "user"
                    : source.value === "public";

                return (
                  <Label
                    key={source.value}
                    htmlFor={source.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-3 transition-colors",
                      isSelected
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-100 text-slate-700 hover:border-blue-100 hover:bg-blue-50/40"
                    )}
                  >
                    <RadioGroupItem
                      value={source.value}
                      id={source.value}
                      className="border-blue-300 text-blue-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{source.label}</span>
                      <span className="block text-xs font-normal text-slate-500">
                        {source.description}
                      </span>
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>
          </FilterSection>

          <Button
            variant="outline"
            className="h-11 w-full border-blue-100 bg-white text-slate-700 shadow-sm hover:bg-blue-50 hover:text-blue-700 disabled:cursor-default disabled:opacity-50"
            disabled={activeFilterCount === 0}
            onClick={clearFilters}
          >
            필터 초기화
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface FilterSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function FilterSection({ title, icon: Icon, children }: FilterSectionProps) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-slate-900">
        <span className="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
          <Icon size={17} />
        </span>
        <h3 className="text-base font-bold">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

interface FilterToggleProps {
  checked: boolean;
  description: string;
  icon: React.ElementType;
  iconClassName: string;
  id: string;
  label: string;
  onCheckedChange: () => void;
}

function FilterToggle({
  checked,
  description,
  icon: Icon,
  iconClassName,
  id,
  label,
  onCheckedChange,
}: FilterToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-colors",
        checked ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-slate-50/70"
      )}
    >
      <Label htmlFor={id} className="flex min-w-0 cursor-pointer items-center gap-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", iconClassName)}>
          <Icon size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">{label}</span>
          <span className="block text-xs font-normal text-slate-500">{description}</span>
        </span>
      </Label>
      <Switch
        id={id}
        checked={checked}
        className="data-[state=checked]:bg-blue-600"
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
