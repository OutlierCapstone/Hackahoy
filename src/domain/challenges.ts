export type Challenge = {
  id: string; // "1", "2" ...
  islandId: string; // 섬과 연결
  title: string;
  description: string;
  serverLink?: string;
  points: number;
};

export const challenges: Challenge[] = [
  {
    id: "1",
    islandId: "1",
    title: "[challenge 1]",
    description: "시나리오 입니다. 시나리오 입니다. ... (데모용 텍스트)",
    serverLink: "https://example.com",
    points: 100,
  },
  {
    id: "2",
    islandId: "1",
    title: "[challenge 2]",
    description: "두 번째 문제 설명(데모)",
    points: 150,
  },
  {
    id: "3",
    islandId: "2",
    title: "[challenge 3]",
    description: "세 번째 문제 설명(데모)",
    points: 200,
  },
];
