#!/usr/bin/env node
//
// psql 이 없는 환경에서도 DB 를 조회할 수 있게 하는 폴백.
// 백엔드가 이미 Prisma 를 쓰므로 @prisma/client 는 반드시 설치돼 있다.
//
// 출력 형식은 psql -At 와 같다 (파이프 구분, 헤더 없음).
//
// 사용법
//   node scripts/db-query.js 'SELECT COUNT(*) FROM "UserLog";'

const sql = process.argv[2];
if (!sql) {
  console.error('사용법: node scripts/db-query.js "<SQL>"');
  process.exit(2);
}

(async () => {
  let prisma;
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  } catch (e) {
    console.error(
      '@prisma/client 를 불러올 수 없다. 레포 루트에서 실행하고 npm ci 가 끝난 상태여야 한다.',
    );
    console.error(e.message);
    process.exit(3);
  }

  try {
    const rows = await prisma.$queryRawUnsafe(sql);
    for (const row of rows) {
      const vals = Object.values(row).map((v) => {
        if (v === null || v === undefined) return '';
        if (typeof v === 'bigint') return v.toString();
        if (v instanceof Date) return v.toISOString();
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v);
      });
      console.log(vals.join('|'));
    }
  } catch (e) {
    console.error(`쿼리 실패: ${e.message}`);
    process.exit(4);
  } finally {
    await prisma.$disconnect();
  }
})();
