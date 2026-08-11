// prisma/seed.js 수정본
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('BanRule 데이터 복구 시작...');

  const rules = [
    { id: 1n, name: "LOGIN_SPAM", condition: "5분 내 20회 실패", threshold: 20 },
    { id: 2n, name: "SIGNUP_LIMIT", condition: "1시간 내 8개 생성", threshold: 8 },
    { id: 3n, name: "DOS_ATTACK", condition: "5분 내 600회 요청", threshold: 600 },
    { id: 4n, name: "SERVER_ERROR", condition: "10분 내 15회 에러", threshold: 15 },
  ];

  for (const rule of rules) {
    await prisma.banRule.upsert({
      where: { id: rule.id },
      update: {
        name: rule.name,
        condition: rule.condition,
        threshold: rule.threshold,
      },
      create: rule,
    });
  }
  console.log('BanRule 데이터 복구 완료!');

  console.log('Island 데이터 복구 시작...');

  const islands = [
    { id: 1, image: "/assets/backgrounds/island-1.png" },
    { id: 2, image: "/assets/backgrounds/island-2.png" },
    { id: 3, image: "/assets/backgrounds/island-3.png" },
  ];

  for (const island of islands) {
    await prisma.island.upsert({
      where: { id: island.id },
      update: {
        image: island.image,
      },
      create: island,
    });
  }

  console.log('Level 데이터 복구 시작...');

  const levels = [
    { levelNum: 1, shipImage: "/assets/ships/ship-1.png" },
    { levelNum: 2, shipImage: "/assets/ships/ship-2.png" },
    { levelNum: 3, shipImage: "/assets/ships/ship-3.png" },
  ];

  for (const level of levels) {
    await prisma.level.upsert({
      where: { levelNum: level.levelNum },
      update: {
        shipImage: level.shipImage,
      },
      create: level,
    });
  }

  console.log('Level 데이터 복구 완료!');
}

main()
  .catch((e) => {
    console.error("데이터 삽입 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });