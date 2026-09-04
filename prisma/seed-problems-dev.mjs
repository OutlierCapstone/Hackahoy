// prisma/seed-problems-dev.mjs
//
// 로컬 개발용 Problem 1~7 시드.
//
// 왜 필요한가
//   UserLog.problemId 가 Problem 을 FK 로 참조한다. 로컬 DB 에 Problem 이 없으면
//   로그 수집이 전부 FK 위반으로 폐기돼서 힌트/지표 쪽을 아예 만져볼 수 없다.
//
// correctFlag 는 실서버 값이 아니라 로컬 더미다. 절대 실플래그를 여기에 적지 말 것.
import { PrismaClient } from '@prisma/client';
import { problems } from './problem-catalog.mjs';

const prisma = new PrismaClient();

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';

  for (const p of problems) {
    const baseData = {
      islandId: p.islandId,
      title: p.title,
      description: p.description,
      hint: p.hint,
      category: p.category,
      serverLink: `http://localhost:${5000 + p.id}`,
    };
    const localFlag = `hackahoy{local_dev_${p.id}}`;
    const prob7Flag =
      p.id === 7 && process.env.PROB7_FLAG
        ? process.env.PROB7_FLAG
        : null;

    // 운영 DB의 문제 1~6 플래그는 각 챌린지 런타임과 별도로 동기화된다.
    // 컨테이너 재기동마다 개발용 더미로 덮어쓰지 않도록 기존 값을 보존한다.
    // 문제 7은 저장소 밖의 런타임 secret이 있으므로 계속 동기화한다.
    const updateData = {
      ...baseData,
      ...(!isProduction || prob7Flag
        ? { correctFlag: prob7Flag ?? localFlag }
        : {}),
    };

    await prisma.problem.upsert({
      where: { id: p.id },
      update: updateData,
      create: {
        id: p.id,
        ...baseData,
        correctFlag: prob7Flag ?? localFlag,
      },
    });
  }

  console.log(
    `Problem ${problems.length}건 시드 완료 (${isProduction ? '운영 플래그 보존' : '로컬 더미 플래그'})`,
  );
}

main()
  .catch((e) => {
    console.error('문제 시드 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
