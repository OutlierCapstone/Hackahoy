import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const islands = [
  { id: 1, image: '/assets/backgrounds/island-1.png' },
  { id: 2, image: '/assets/backgrounds/island-2.png' },
  { id: 3, image: '/assets/backgrounds/island-3.png' },
];

async function main() {
  // 1) islands upsert
  for (const island of islands) {
    await prisma.island.upsert({
      where: { id: island.id },
      update: { image: island.image },
      create: { id: island.id, image: island.image },
    });
  }

  // 2) problem upsert(중복 방지)
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
