// src/domain/types/Island.ts
export interface Island {
  id: string; // 'default' | 'promptinj' | 'idor' | 'datapoisoning' 이런 식
  name: string; // 화면에 보여줄 섬 이름
  mapX: number; // 메인 맵에서 왼쪽에서부터 퍼센트 위치 (0~100)
  mapY: number; // 메인 맵에서 위에서부터 퍼센트 위치 (0~100)
  iconImage: string; // /assets/islands/ 섬 아이콘
  backgroundImage: string; // /assets/backgrounds/ 섬 내부 배경
}
