import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class AiTutorService {
  constructor(private prisma: PrismaService) {}

  private readonly AI_TUTOR_URL = 'http://127.0.0.1:8000';

  // 🔥 날짜를 "YYYY-MM-DD HH:mm:ss" 형식으로 변환하는 헬퍼 함수
  private formatDate(date: Date | null): string {
    if (!date) return "2026-01-01 00:00:00";
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' +
      pad(date.getDate()) + ' ' +
      pad(date.getHours()) + ':' +
      pad(date.getMinutes()) + ':' +
      pad(date.getSeconds())
    );
  }

// 1. getAiHint 함수 수정
async getAiHint(userId: string, problemId: number) {
  const context = await this.getDebugContext(userId, problemId);
  try {
    const response = await axios.post(`${this.AI_TUTOR_URL}/hint/`, context);
    
    // 🔥 AI 서버의 응답 구조가 response.data.hint 인지 다시 확인하세요!
    const aiHint = response.data;

    if (aiHint) {
      console.log("✅ DB에 저장할 힌트:", aiHint);
      // 🔥 여기서 aiHint가 확실히 전달되는지 확인
      await this.createHintRecord(userId, problemId, aiHint);
    } else {
      console.warn("⚠️ AI 서버가 응답했으나 힌트 문자열이 비어있음");
    }

    return aiHint;
  } catch (error) {
    console.error("[ERROR] 연동 실패:", error.response?.data || error.message);
    throw new HttpException('AI 튜터 응답 실패', HttpStatus.BAD_GATEWAY);
  }
}

  /**
   * 2. [연동] AI 문제 추천 요청 (에러 해결용 함수 추가)
   */
  async getAiRecommendation(userId: string) {
    const context = await this.getSolvedProblemContext(userId);
    console.log("[STEP 2] AI 추천 요청 데이터:", JSON.stringify(context, null, 2));

    try {
      const response = await axios.post(`${this.AI_TUTOR_URL}/recommendation/`, context);
      
      console.log("[STEP 3] AI 추천 서버 응답(RAW):", response.data);

      // 🔥 응답이 "3" 같은 문자열이므로 숫자로 변환
      const recommendedId = Number(response.data);

      // 만약 응답이 숫자가 아니거나(예: "No more problems"), 0 이하라면 예외 처리
      if (!recommendedId || isNaN(recommendedId)) {
        return { 
          recommended_problem_id: null, 
          message: typeof response.data === 'string' ? response.data : "추천할 문제를 찾지 못했습니다." 
        };
      }
      
      console.log(`✅ 추출된 추천 문제 ID: ${recommendedId}`);
      return { 
        recommended_problem_id: recommendedId, 
        message: "AI 튜터의 추천 문제입니다!" 
      };
      
    } catch (error) {
      console.error('❌ AI 추천 API 에러:', error.response?.data || error.message);
      return { 
        recommended_problem_id: null, 
        message: "추천 서버 연결에 실패했습니다." 
      };
    }
  }

  /**
   * --- 데이터 추출 헬퍼 함수 (힌트용) ---
   */
  async getDebugContext(userId: string, problemId: number) {
    const lastHint = await this.prisma.hintHistory.findFirst({
      where: { userId, problemId },
      orderBy: { usedAt: 'desc' },
    });
    const firstView = await this.prisma.userEvent.findFirst({
      where: { userId, problemId, type: 'VIEW_PROBLEM' },
      orderBy: { createdAt: 'asc' },
    });

    // 힌트가 있든 없든 로그를 긁어오되, 필터링 시간을 안전하게 잡음
    const filterTime = lastHint?.usedAt || firstView?.createdAt || new Date(0);
    const logs = await this.prisma.userLog.findMany({
      where: { userId, problemId, createdAt: { gt: filterTime } },
      orderBy: { createdAt: 'asc' },
      // take: 10, // 너무 많으면 터질 수 있으니 최근 10개만
    });

    return {
      problem_id: problemId.toString(),
      hint_count: lastHint ? lastHint.hintCount : 0,
      history: {
        first_viewed_at: this.formatDate(firstView?.createdAt || new Date()),
        last_hint_at: this.formatDate(lastHint?.usedAt || new Date()),
        // 💡 빈 문자열("") 대신 "None" 또는 실제 내용을 명시
        previous_hint: lastHint?.lastHintContent && lastHint.lastHintContent.trim() !== "" 
          ? lastHint.lastHintContent 
          : "None"
      },
      // 💡 중요: 로그가 비어있으면 AI가 분석할 게 없어 500 에러가 날 수 있음
      logs: logs.length > 0 
        ? logs.map(l => {
            let displayHeader = l.header;
            if (typeof l.header === 'object' && l.header !== null && 'request' in (l.header as any)) {
              displayHeader = (l.header as any).request;
            }
            return {
              timestamp: this.formatDate(l.createdAt),
              header: String(displayHeader || "Unknown Request"),
              body: l.body || {}
            };
          })
        : [{ timestamp: this.formatDate(new Date()), header: "No logs found", body: {} }] 
    };
  }

  /**
   * --- 힌트 기록 저장 ---
   */
  // 2. createHintRecord 함수 수정
  async createHintRecord(userId: string, problemId: number, content: string) {
    const last = await this.prisma.hintHistory.findFirst({
      where: { userId, problemId },
      orderBy: { hintCount: 'desc' },
    });

    return await this.prisma.hintHistory.create({
      data: { 
        userId, 
        problemId, 
        lastHintContent: content, // 🔥 여기에 null이 들어가지 않도록 content 확인
        hintCount: (last?.hintCount || 0) + 1,
        usedAt: new Date() // 타임스탬프 강제 업데이트
      },
    });
  }

  /**
   * --- 데이터 추출 헬퍼 함수 (추천용) ---
   */
  async getSolvedProblemContext(userId: string) {
    // 1. 유저의 풀이 기록 가져오기
    const solvedRecords = await this.prisma.solvedHistory.findMany({
      where: { userId },
      orderBy: { solvedAt: 'desc' },
    });

    // 2. 기록이 없으면 빈 배열 반환
    if (solvedRecords.length === 0) {
      return { 
        last_solved_problem_id: null, 
        solved_problems: [] 
      };
    }

    // 3. 마지막으로 푼 문제 ID (가장 최근 기록)
    const lastId = solvedRecords[0].problemId;

    // 4. 각 문제별 상세 데이터 가공
    const solved_problems = await Promise.all(
      solvedRecords.map(async (record) => {
        // 해당 문제를 처음 본 시간 찾기 (시간 측정용)
        const firstView = await this.prisma.userEvent.findFirst({
          where: { userId, problemId: record.problemId, type: 'VIEW_PROBLEM' },
          orderBy: { createdAt: 'asc' },
        });

        // 해당 문제에서 힌트를 몇 번 썼는지 확인
        const hintCount = await this.prisma.hintHistory.count({
          where: { userId, problemId: record.problemId }
        });

        // 소요 시간 계산 (초 단위)
        const timeSpent = firstView 
          ? Math.floor((record.solvedAt.getTime() - firstView.createdAt.getTime()) / 1000) 
          : 0;

        return { 
          problem_id: record.problemId.toString(), 
          time_spent: timeSpent, 
          hint_count: hintCount // 🔥 hint_used 대신 hint_count로 수정
        };
      })
    );

    // 5. 🔥 AI 서버가 요구하는 최종 JSON 구조 (필드명 수정)
    return { 
      last_solved_problem_id: lastId.toString(), // 🔥 last_problem_id 대신 수정
      solved_problems 
    };
  }
}