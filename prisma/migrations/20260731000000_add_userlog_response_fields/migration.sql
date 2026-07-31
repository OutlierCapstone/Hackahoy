-- 로컬에 DATABASE_URL 이 없어서 `npx prisma migrate dev` 가 실패하는 경우,
-- 이 파일을 아래 경로에 그대로 넣으면 된다:
--
--   prisma/migrations/20260731000000_add_userlog_response_fields/migration.sql
--
-- (폴더명 앞 숫자는 타임스탬프이므로 기존 마이그레이션보다 뒤에 오기만 하면 된다)
--
-- 서버 배포 시 deploy.sh 의 `npx prisma migrate deploy` 가 이걸 적용한다.

ALTER TABLE "UserLog" ADD COLUMN "query" TEXT;
ALTER TABLE "UserLog" ADD COLUMN "status" INTEGER;
ALTER TABLE "UserLog" ADD COLUMN "respBytes" INTEGER;
ALTER TABLE "UserLog" ADD COLUMN "elapsedMs" INTEGER;

CREATE INDEX "UserLog_userId_problemId_createdAt_idx"
    ON "UserLog"("userId", "problemId", "createdAt");
