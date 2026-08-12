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

const prisma = new PrismaClient();

const problems = [
  { id: 1, islandId: 1, title: '입항 신고', category: 'AI', description: 'LLM Data Poisoning', hint: '규칙 파일이 무엇을 신뢰하는지 보라.' },
  { id: 2, islandId: 1, title: '선장님의 임무 목록 조회', category: 'WEB', description: 'IDOR', hint: '내 것이 아닌 식별자를 넣어보라.' },
  { id: 3, islandId: 1, title: '검은수염은 보물 위치를 알고 있을까', category: 'AI', description: 'Prompt Injection', hint: '시스템 프롬프트를 덮어쓸 수 있는지 보라.' },
  { id: 4, islandId: 2, title: '저주 받은 무전기', category: 'WEB', description: 'Command Injection', hint: '입력이 셸로 그대로 가는지 보라.' },
  { id: 5, islandId: 2, title: '전설의 황금 해골 탈취', category: 'WEB', description: 'IDOR', hint: '식별자 규칙을 추측해보라.' },
  { id: 6, islandId: 2, title: '인력 사무소의 명부', category: 'WEB', description: 'JWT 권한상승', hint: '토큰의 서명 알고리즘을 확인하라.' },
  { id: 7, islandId: 3, title: '과자 마을 출입', category: 'AI', description: '이미지 오분류', hint: '분류기가 무엇을 보고 판단하는지 보라.' },
];

async function main() {
  for (const p of problems) {
    const data = {
      islandId: p.islandId,
      title: p.title,
      description: p.description,
      hint: p.hint,
      category: p.category,
      // 로컬 더미 플래그. 실서버 값과 무관하다.
      correctFlag: `hackahoy{local_dev_${p.id}}`,
      serverLink: `http://localhost:${5000 + p.id}`,
    };

    await prisma.problem.upsert({
      where: { id: p.id },
      update: data,
      create: { id: p.id, ...data },
    });
  }

  console.log(`Problem ${problems.length}건 시드 완료 (로컬 더미 플래그)`);
}

main()
  .catch((e) => {
    console.error('문제 시드 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
