/*
 * 파일 위치: src/app/components/ui/label.tsx
 * 상위 폴더: src/app/components/ui (공통 디자인 시스템 UI 컴포넌트)
 * 역할: 공통 UI 컴포넌트입니다. 여러 화면에서 재사용되는 'label' UI를 제공합니다.
 */
"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "./utils";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
