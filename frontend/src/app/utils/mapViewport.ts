// 확대 비율을 먼저 변경한 뒤 중심을 이동해 지도 이동 애니메이션과 확대가 겹치지 않도록 합니다.
export function focusMapAt<Position>(map: {
  getLevel: () => number;
  setLevel: (level: number, options: { animate: boolean; anchor: Position }) => void;
  setCenter: (position: Position) => void;
}, position: Position, maximumLevel: number) {
  map.setLevel(Math.min(map.getLevel(), maximumLevel), { animate: false, anchor: position });
  map.setCenter(position);
}
