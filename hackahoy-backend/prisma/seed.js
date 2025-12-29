import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const levels = [
  {
    levelNum: 1,
    expRequired: 0,
    shipName: 'Starter Ship',
    shipImage: '/assets/ships/ship-1.png',
  },
  {
    levelNum: 2,
    expRequired: 100,
    shipName: 'Advanced Ship',
    shipImage: '/assets/ships/ship-2.png',
  },
  {
    levelNum: 3,
    expRequired: 300,
    shipName: 'Pro Ship',
    shipImage: '/assets/ships/ship-3.png',
  },
];

const islands = [
  { id: 1, image: '/assets/backgrounds/island-1.png' },
  { id: 2, image: '/assets/backgrounds/island-2.png' },
  { id: 3, image: '/assets/backgrounds/island-3.png' },
];

async function main() {
  // 1) Level upsert (로그인 에러 해결의 핵심!)
  for (const level of levels) {
    await prisma.level.upsert({
      where: { levelNum: level.levelNum },
      update: {
        expRequired: level.expRequired,
        shipName: level.shipName,
        shipImage: level.shipImage,
      },
      create: level,
    });
  }

  // 2) islands upsert
  for (const island of islands) {
    await prisma.island.upsert({
      where: { id: island.id },
      update: { image: island.image },
      create: { id: island.id, image: island.image },
    });
  }

  // 3) problem upsert
  await prisma.problem.upsert({
    where: { id: 1 },
    update: {
      islandId: 1,
      title: 'First Challenge',
      description: 'Solve me',
      hint: 'try test',
      correctFlag: 'test',
    },
    create: {
      id: 1,
      islandId: 1,
      title: 'First Challenge',
      description: 'Solve me',
      hint: 'try test',
      correctFlag: 'test',
    },
  });

  console.log(
    '🌱 Seed data (Levels, Islands, Problems) inserted successfully!',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
