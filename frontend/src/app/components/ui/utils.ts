// utils는 UI 컴포넌트에서 className을 깔끔하게 합치는 도우미 함수입니다.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
