/*
 * 파일 위치: src/app/components/ui/aspect-ratio.tsx
 * 상위 폴더: src/app/components/ui (공통 디자인 시스템 UI 컴포넌트)
 * 역할: 공통 UI 컴포넌트입니다. 여러 화면에서 재사용되는 'aspect-ratio' UI를 제공합니다.
 */
"use client";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
