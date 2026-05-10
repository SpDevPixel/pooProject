/*
 * 파일 위치: src/app/components/ui/utils.ts
 * 상위 폴더: src/app/components/ui (공통 디자인 시스템 UI 컴포넌트)
 * 역할: className 병합 등 공통 UI 컴포넌트에서 쓰는 유틸 함수입니다.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
