// src/ai-tutor/ai-tutor.service.ts
//
// 변경 요약 (getDebugContext 만 변경, 나머지 메서드는 기존과 동일)
//   1) 로그에 status / resp_bytes / elapsed_ms 를 실어 보낸다.
//   2) 틀린 flag 제출 기록(SubmitFlag)을 함께 넘긴다.
//      "학습자가 무엇을 정답이라고 생각했는가"는 막힌 지점을 드러내는 강한 신호인데
//      이미 DB 에 쌓여 있으면서 힌트 컨텍스트에는 안 들어가고 있었다.
//      LogEntry 스키마를 바꾸지 않으려고 의사(pseudo) 로그 엔트리로 합쳐 시간순 정렬한다.
//   3) 최근 20건으로 상한을 둔다 (전체를 넘기면 프롬프트가 터진다).

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

const MAX_LOGS = 20;

@Injectable()
export class AiTutorService {
  constructor(private prisma: PrismaService) {}

  private readonly AI_TUTOR_URL = 'http://127.0.0.1:8000';

  private formatDate(date: Date | null): string {
    if (!date) return '2026-01-01 00:00:00';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      date.getFullYear() +
      '-' +
      pad(date.getMonth() + 1) +
      '-' +
      pad(date.getDate()) +
      ' ' +
      pad(date.getHours()) +
      ':' +
      pad(date.getMinutes()) +
      ':' +
      pad(date.getSeconds())
    );
  }

  async getAiHint(userId: string, problemId: number) {
    const context = await this.getDebugContext(userId, problemId);
    try {
      const response = await axios.post(`${this.AI_TUTOR_URL}/hint/`, context);
      const aiHint = response.data;

      if (aiHint) {
        await this.createHintRecord(userId, problemId, aiHint);
      }

      return aiHint;
    } catch (error) {
      console.error('[ERROR] 연동 실패:', error.response?.data || error.message);
      throw new HttpException('AI 튜터 응답 실패', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * 힌트 생성에 넘길 컨텍스트 조립
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

    // 직전 힌트 이후(없으면 문제를 처음 본 시점 이후)의 활동만 본다
    const filterTime = lastHint?.usedAt || firstView?.createdAt || new Date(0);

    const rawLogs = await this.prisma.userLog.findMany({
      where: { userId, problemId, createdAt: { gt: filterTime } },
      orderBy: { createdAt: 'desc' },
      take: MAX_LOGS,
    });

    // 틀린 flag 제출 = 학습자가 무엇을 답이라고 생각했는지 드러나는 신호
    const wrongSubmits = await this.prisma.submitFlag.findMany({
      where: {
        userId,
        problemId,
        isCorrect: false,
        submittedAt: { gt: filterTime },
      },
      orderBy: { submittedAt: 'desc' },
      take: 5,
    });

    type Entry = {
      at: Date;
      timestamp: string;
      header: string;
      body: any;
      status?: number | null;
      resp_bytes?: number | null;
      elapsed_ms?: number | null;
    };

    const entries: Entry[] = [];

    for (const l of rawLogs) {
      let displayHeader: any = l.header;
      if (
        typeof l.header === 'object' &&
        l.header !== null &&
        'request' in (l.header as any)
      ) {
        displayHeader = (l.header as any).request;
      }

      // 쿼리스트링이 있으면 요청 라인에 붙여 준다 (GET 기반 시도를 살리기 위함)
      let header = String(displayHeader || 'Unknown Request');
      if ((l as any).query) {
        header = `${header}?${(l as any).query}`;
      }

      entries.push({
        at: l.createdAt,
        timestamp: this.formatDate(l.createdAt),
        header,
        body: l.body || {},
        status: (l as any).status ?? null,
        resp_bytes: (l as any).respBytes ?? null,
        elapsed_ms: (l as any).elapsedMs ?? null,
      });
    }

    for (const s of wrongSubmits) {
      entries.push({
        at: s.submittedAt,
        timestamp: this.formatDate(s.submittedAt),
        header: 'SUBMIT FLAG (오답)',
        body: { submitted_flag: s.submittedFlag },
        status: null,
        resp_bytes: null,
        elapsed_ms: null,
      });
    }

    // 시간 오름차순 정렬 (AI 가 시도 순서를 읽을 수 있어야 한다)
    entries.sort((a, b) => a.at.getTime() - b.at.getTime());

    const logs = entries.length
      ? entries.map(({ at, ...rest }) => rest)
      : [
          {
            timestamp: this.formatDate(new Date()),
            header: 'No logs found',
            body: {},
            status: null,
            resp_bytes: null,
            elapsed_ms: null,
          },
        ];

    return {
      problem_id: problemId.toString(),
      hint_count: lastHint ? lastHint.hintCount : 0,
      history: {
        first_viewed_at: this.formatDate(firstView?.createdAt || new Date()),
        last_hint_at: this.formatDate(lastHint?.usedAt || new Date()),
        previous_hint:
          lastHint?.lastHintContent && lastHint.lastHintContent.trim() !== ''
            ? lastHint.lastHintContent
            : 'None',
      },
      logs,
    };
  }

  async createHintRecord(userId: string, problemId: number, content: string) {
    const last = await this.prisma.hintHistory.findFirst({
      where: { userId, problemId },
      orderBy: { hintCount: 'desc' },
    });

    return await this.prisma.hintHistory.create({
      data: {
        userId,
        problemId,
        lastHintContent: content,
        hintCount: (last?.hintCount || 0) + 1,
        usedAt: new Date(),
      },
    });
  }

  /**
   * [연동] AI 문제 추천 요청
   */
  async getAiRecommendation(userId: string) {
    const context = await this.getSolvedProblemContext(userId);

    try {
      const response = await axios.post(
        `${this.AI_TUTOR_URL}/recommendation/`,
        context,
      );

      const recommendedId = Number(response.data);

      if (!recommendedId || isNaN(recommendedId)) {
        return {
          recommended_problem_id: null,
          message:
            typeof response.data === 'string'
              ? response.data
              : '추천할 문제를 찾지 못했습니다.',
        };
      }

      return {
        recommended_problem_id: recommendedId,
        message: 'AI 튜터의 추천 문제입니다!',
      };
    } catch (error) {
      console.error('AI 추천 API 에러:', error.response?.data || error.message);
      return {
        recommended_problem_id: null,
        message: '추천 서버 연결에 실패했습니다.',
      };
    }
  }

  /**
   * --- 데이터 추출 헬퍼 (추천용) ---
   */
  async getSolvedProblemContext(userId: string) {
    const solvedRecords = await this.prisma.solvedHistory.findMany({
      where: { userId },
      orderBy: { solvedAt: 'desc' },
    });

    if (solvedRecords.length === 0) {
      return { last_solved_problem_id: null, solved_problems: [] };
    }

    const lastId = solvedRecords[0].problemId;

    const solved_problems = await Promise.all(
      solvedRecords.map(async (record) => {
        const firstView = await this.prisma.userEvent.findFirst({
          where: { userId, problemId: record.problemId, type: 'VIEW_PROBLEM' },
          orderBy: { createdAt: 'asc' },
        });

        const hintCount = await this.prisma.hintHistory.count({
          where: { userId, problemId: record.problemId },
        });

        const timeSpent = firstView
          ? Math.floor(
              (record.solvedAt.getTime() - firstView.createdAt.getTime()) / 1000,
            )
          : 0;

        return {
          problem_id: record.problemId.toString(),
          time_spent: timeSpent,
          hint_count: hintCount,
        };
      }),
    );

    return {
      last_solved_problem_id: lastId.toString(),
      solved_problems,
    };
  }
}