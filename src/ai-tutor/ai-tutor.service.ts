import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // 본인의 PrismaService 경로

@Injectable()
export class AiTutorService {
  constructor(private prisma: PrismaService) {}

  async getDebugContext(userId: string, problemId: number) {
    // 1. 마지막 힌트 기록
    const lastHint = await this.prisma.hintHistory.findFirst({
      where: { userId, problemId },
      orderBy: { usedAt: 'desc' },
    });

    // 2. 처음 문제 접속 기록
    const firstView = await this.prisma.userEvent.findFirst({
      where: { userId, problemId, type: 'VIEW_PROBLEM' },
      orderBy: { createdAt: 'asc' },
    });

    const filterTime = lastHint?.usedAt || firstView?.createdAt || new Date(0);

    // 3. UserLog 데이터 추출
    const logs = await this.prisma.userLog.findMany({
      where: { userId, problemId, createdAt: { gt: filterTime } },
      orderBy: { createdAt: 'asc' },
    });

    // 요청하신 형식으로 데이터 가공 및 반환
    return {
      problem_id: problemId.toString(),
      hint_count: lastHint ? lastHint.hintCount : 0,
      history: {
        first_viewed_at: firstView?.createdAt || "N/A",
        last_hint_at: lastHint?.usedAt || "",
        previous_hint: lastHint?.lastHintContent || "",
      },
      logs: logs.map(l => {
        // 🔥 header 가공 로직: 객체에서 문자열만 추출
        let displayHeader = l.header;
        
        // 만약 header가 { "request": "POST ..." } 형태라면 값만 추출
        if (typeof l.header === 'object' && l.header !== null && 'request' in (l.header as any)) {
          displayHeader = (l.header as any).request;
        }

        return {
          timestamp: l.createdAt,
          header: displayHeader, // 이제 {"request":...} 가 아니라 "POST /api/..." 문자열만 들어감
          body: l.body
        };
      })
    };
  }
  async createHintRecord(userId: string, problemId: number, content: string) {
    // 1. 현재까지 이 유저가 해당 문제에서 요청한 힌트 횟수를 조회합니다.
    const lastRecord = await this.prisma.hintHistory.findFirst({
      where: { userId, problemId },
      orderBy: { hintCount: 'desc' },
    });

    const nextCount = lastRecord ? lastRecord.hintCount + 1 : 1;

    // 2. 새로운 힌트 기록을 생성합니다.
    return await this.prisma.hintHistory.create({
      data: {
        userId,
        problemId,
        lastHintContent: content,
        hintCount: nextCount,
        usedAt: new Date(),
      },
    });
  }
  async getSolvedProblemContext(userId: string) {
    // 1. SolvedHistory에서 해결 기록 가져오기
    const solvedRecords = await this.prisma.solvedHistory.findMany({
      where: { userId },
      orderBy: { solvedAt: 'desc' },
    });

    if (solvedRecords.length === 0) return { last_problem_id: null, solved_problems: [] };

    const lastProblemId = solvedRecords[0].problemId;

    // 2. 직전 문제의 힌트 카운트만 가져오기
    const lastHintCount = await this.prisma.hintHistory.count({
      where: { userId, problemId: lastProblemId },
    });

    // 3. 전체 리스트 구성
    const solved_problems = await Promise.all(
      solvedRecords.map(async (record) => {
        // 소요 시간 계산을 위해 VIEW_PROBLEM 이벤트 조회
        const firstView = await this.prisma.userEvent.findFirst({
          where: { userId, problemId: record.problemId, type: 'VIEW_PROBLEM' },
          orderBy: { createdAt: 'asc' },
        });

        const timeSpent = firstView 
          ? Math.floor((record.solvedAt.getTime() - firstView.createdAt.getTime()) / 1000)
          : 0;

        return {
          problem_id: record.problemId.toString(),
          time_spent: timeSpent > 0 ? timeSpent : 0,
          // 직전 문제만 힌트 카운트 표시, 나머지는 0
          hint_used: record.problemId === lastProblemId ? lastHintCount : 0,
        };
      })
    );

    return {
      last_problem_id: lastProblemId.toString(),
      solved_problems: solved_problems,
    };
  }
}