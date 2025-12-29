const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const levels = [
  { levelNum: 1, shipImage: '/assets/ships/ship-1.png' },
  { levelNum: 2, shipImage: '/assets/ships/ship-2.png' },
  { levelNum: 3, shipImage: '/assets/ships/ship-3.png' },
];

const islands = [
  { id: 1, image: '/assets/backgrounds/island-1.png' },
  { id: 2, image: '/assets/backgrounds/island-2.png' },
  { id: 3, image: '/assets/backgrounds/island-3.png' },
];

// 3. 기본 문제 3개 데이터
const problems = [
  {
    id: 1,
    islandId: 1,
    title: '첫 번째 챌린지: 입항 신고',
    description:
      '해적 세계에 오신 것을 환영합니다! 첫 번째 플래그를 입력하세요.',
    hint: '플래그 형식은 test 입니다.',
    correctFlag: 'hackahoy{eScape_1s_0n1y_beginnin9}',
    serverLink: 'http://52.78.240.6:8001', // 실제 서버 IP
  },
  {
    id: 2,
    islandId: 1,
    title: '두 번째 챌린지: 암호 해독',
    description:
      '돌섬 인근 해역을 지나던 중, 끔찍한 굉음과 함께 배가 멈춰 섰다. 수면 아래 숨겨진 암초에 배 밑바닥이 제대로 걸린 것 같다. 당황한 선원들과 달리, 선장님은 불같이 화를 내며 소리쳤다. \n\"배가 가라앉기 전에 어떻게든 해결해!! 난 지휘실에서 이 위기를 탈출할 작전을 구상할 테니까… 절대 방해하지 마!\"\n쾅! 소리와 함께 선장실 문은 굳게 잠겼다.\n 우리에게 떨어진 임무 목록을 확인해보니... 이건 도저히 오늘 안에 끝낼 수 있는 양이 아니었다. 파손된 선체 수리부터 시작해서 갯지렁이 개수 세기 같은 쓸모없는 잡무까지...\n그런데 잠깐, 이렇게 많은 일을 시켜 놓고 선장님은 대체 무슨 \'작전\'을 짜고 계신 걸까? 정말 작전을 짜고 있는 게 맞을까?',
    hint: '혹시... 선장님의 임무 목록을 훔쳐볼 방법이 없을까?',
    correctFlag: 'hackahoy{ID0R_Capta1n_Secr3t}',
    serverLink: 'http://52.78.240.6:8002',
  },
  {
    id: 3,
    islandId: 1,
    title: '검은수염은 보물 위치를 알고 있을까',
    description:
      '솜사탕 바다는 온통 분홍빛 물결이 일렁이는 곳. 그 한가운데 솜사탕 섬이 있다. \n전설에 따르면, 이 섬 어딘가에 세상에서 가장 달콤하고도 황홀한 힘을 가진 보물이 숨겨져 있다고 한다. \n혼자 찾아보기엔 섬의 지형은 수수께끼로 가득하고, 수상한 마력이 몸을 무겁게 짓누른다. \n때마침, 소금기 어린 바다 냄새와 함께 닻을 내린 해적선 검은 까마귀호. \n그리고 그 위에 선 사람… 바로 악명 높은 해적선장 \‘검은 수염\’. \n잔혹하다는 소문도, 장난기가 심하다는 소문도 있지만 확실한 건 해적 규약에 따라 움직이는 자라는 것. \n당신은 보물의 단서를 찾기 위해 검은 수염에게 접근한다.',
    hint: '해적 규약은 줄마다 해석의 여지가 있다는데…\n아무리 비밀이라도, 규약에 맞게 물으면 답해야 하는 걸까?\n현재의 규약을 논리적으로 무력화하거나 새 규약으로 덮어씌우는 방식을 고민해보자. \n규약을 읽고 따르는 존재라면, 규약을 건드리면 결과가 바뀌지 않을까? \n재치 있게 규약을 뒤틀면 비밀이 새어나올지도 모른다. \#prompt_injection',
    correctFlag: 'hackahoy{Und3r_the_tr33}',
    serverLink: 'http://52.78.240.6:8003',
  },
];

async function main() {
  // 1) Level
  for (const level of levels) {
    await prisma.level.upsert({
      where: { levelNum: level.levelNum },
      update: { shipImage: level.shipImage },
      create: level,
    });
  }

  // 2) Island (update에서 id 제외)
  for (const island of islands) {
    const { id, ...data } = island;
    await prisma.island.upsert({
      where: { id },
      update: data,
      create: island, // 고정 id를 쓰려면 create에는 id 포함 가능
    });
  }

  // 3) Problem (update에서 id 제외)  <-- 핵심
  for (const problem of problems) {
    const { id, ...data } = problem;
    await prisma.problem.upsert({
      where: { id },
      update: data,
      create: problem, // 고정 id를 쓰려면 create에는 id 포함 가능
    });
  }

  // 4) 시퀀스 리셋
  await prisma.$executeRaw`
    SELECT setval(pg_get_serial_sequence('"Problem"', 'id'), 4, false);
  `;
  await prisma.$executeRaw`
    SELECT setval(pg_get_serial_sequence('"Island"', 'id'), 4, false);
  `;

  // 5) Island 기본 이미지 DEFAULT
  await prisma.$executeRaw`
    ALTER TABLE "Island"
    ALTER COLUMN "image"
    SET DEFAULT '/assets/islands/island-default.png';
  `;

  console.log('🌱 Seed 완료');
}

main()
  .catch((e) => {
    console.error('❌ 에러:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
