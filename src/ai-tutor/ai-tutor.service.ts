// src/ai-tutor/ai-tutor.service.ts
//
// 변경 요약 (getDebugContext 만 변경, 나머지 메서드는 기존과 동일)
//   1) 로그에 status / resp_bytes / elapsed_ms 를 실어 보낸다.
//   2) 틀린 flag 제출 기록(SubmitFlag)을 함께 넘긴다.
//      "학습자가 무엇을 정답이라고 생각했는가"는 막힌 지점을 드러내는 강한 신호인데
//      이미 DB 에 쌓여 있으면서 힌트 컨텍스트에는 안 들어가고 있었다.
//      LogEntry 스키마를 바꾸지 않으려고 의사(pseudo) 로그 엔트리로 합쳐 시간순 정렬한다.
//   3) 최근 20건으로 상한을 둔다 (전체를 넘기면 프롬프트가 터진다).

import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const MAX_LOGS = 20;

// ---------------------------------------------------------------------------
// 힌트 게이팅
//
// 왜 필요한가
//   힌트 레벨은 hint_count 로 올라가고, 레벨 3 이 되면 참조 문서에 write-up(정답)이
//   포함된다. 즉 버튼을 연타하면 시도 없이도 정답 풀이에 도달한다.
//   섹션 필터만으로는 "힌트를 반복하면 답이 나온다"를 막지 못한다.
//
// 어떻게 막는가
//   다음 힌트를 열려면 직전 힌트 이후 "서로 다른 실제 시도" 가 필요하고,
//   그 개수가 힌트를 받을수록 늘어난다(누진). required = min(hint_count, CAP).
//     1번째 힌트: 0건 (무료)   2번째: 1건   3번째: 2건   4번째: 3건 ...
//   write-up 이 검색 후보에 처음 들어오는 것은 7번째 힌트(hint_count=6 -> level 3)이고,
//   그때까지 필요한 누적 시도는 20건이다.
//
// 시간 탈출구와 정답 섹션의 관계 (중요)
//   오래 막힌 학습자를 구제하려고 "직전 힌트 후 N분 경과 시 해제" 를 두는데,
//   이걸 무제한 허용하면 기다리기만 해도 정답에 도달한다. 게다가 파이썬쪽
//   calculate_level 은 10분 경과에 score +1 을 주므로 기다리는 쪽이 오히려 빠르다.
//   그래서 hint_count >= GATE_NO_ESCAPE_FROM 부터는 시간으로 열어 주지 않는다.
//   => 정답 섹션은 시간으로 열 수 없고 실제 시도만으로 도달한다.
//
// 왜 기본값이 off 인가
//   로그 수집이 정상 동작하지 않으면 시도 건수가 항상 0 이라 모든 힌트가 영구 차단된다.
//   실서버에서 UserLog 에 공격 로그가 쌓이는 것을 확인한 뒤 HINT_GATE_ENABLED=true 로 켠다.
//   (scripts/verify-log-collection.sh 로 확인 가능)
// ---------------------------------------------------------------------------
// 설정값은 클래스 생성 이후 ConfigService 에서 읽는다.
// 모듈 최상단에서 process.env 를 읽으면 ConfigModule.forRoot() 가 .env 를 로드하기 전에
// 평가될 수 있어, .env 에 HINT_GATE_ENABLED=true 가 있어도 항상 false 가 되는 문제가 있다.
const DEFAULT_GATE_CAP = 5;
const DEFAULT_GATE_ESCAPE_MIN = 10;

/**
 * hint_count 가 이 값 이상이면 시간 경과로 게이트를 열어 주지 않는다.
 *
 * 3 으로 두는 근거
 *   초반 3번까지는 시간으로 구제한다. 아직 단서가 부족한 단계에서 하드 블록하면
 *   학습이 아니라 이탈이 되고, 로그 수집 장애 시 완전 차단되는 것도 막아야 한다.
 *   4번째부터는 시간으로 열리지 않으므로, 정답 섹션(write-up)에 닿기 위해서는
 *   최소 3+4+5 = 12건의 서로 다른 실제 시도가 반드시 필요하다.
 *   기다리지 않는 경우에는 누적 20건이 필요하다.
 *
 * hints.py 의 SECTION_MAP / calculate_level 을 바꾸면 이 값도 함께 검토해야 한다.
 */
const DEFAULT_GATE_NO_ESCAPE_FROM = 3;

/** 시도로 세지 않는 요청. 힌트 요청 자체가 시도로 잡히면 게이트가 스스로 열린다. */
const NON_ATTEMPT_PATTERNS = [
  /ai[-/]?tutor/i,
  /\/api\/ai\//i,
  /\/hint\b/i,
];

export interface HintResult {
  hint: string;
  gated: boolean;
  attempts?: number;
  required?: number;
}

@Injectable()
export class AiTutorService {
  private readonly logger = new Logger('AiTutorService');

  constructor(
    private prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private readonly AI_TUTOR_URL = 'http://127.0.0.1:8000';

  private get gateEnabled(): boolean {
    return (
      this.config.get<string>('HINT_GATE_ENABLED', 'false').toLowerCase() ===
      'true'
    );
  }

  private numberConfig(name: string, fallback: number): number {
    const parsed = Number(this.config.get<string>(name));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  private get gateCap(): number {
    return this.numberConfig('HINT_GATE_CAP', DEFAULT_GATE_CAP);
  }

  private get gateEscapeMin(): number {
    return this.numberConfig('HINT_GATE_ESCAPE_MIN', DEFAULT_GATE_ESCAPE_MIN);
  }

  private get gateNoEscapeFrom(): number {
    return this.numberConfig(
      'HINT_GATE_NO_ESCAPE_FROM',
      DEFAULT_GATE_NO_ESCAPE_FROM,
    );
  }

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

  /**
   * 직전 힌트 이후의 "서로 다른 실제 시도" 개수.
   *
   * 같은 요청을 반복해서 게이트를 여는 것을 막기 위해 (요청라인, 바디) 서명으로
   * 중복을 제거한다. 힌트 요청 자체와 로그가 없을 때 채워지는 더미는 제외한다.
   */
  private countMeaningfulAttempts(logs: any[]): number {
    const seen = new Set<string>();
    for (const l of logs ?? []) {
      const header = String(l?.header ?? '');
      if (!header || header === 'No logs found') continue;
      if (NON_ATTEMPT_PATTERNS.some((re) => re.test(header))) continue;
      seen.add(`${header}|${JSON.stringify(l?.body ?? {})}`);
    }
    return seen.size;
  }

  /**
   * 게이트 판정. blocked 이면 LLM 을 호출하지 않고 HintHistory 도 남기지 않는다.
   * (차단된 요청으로 hint_count 가 오르면 막힐수록 레벨이 올라가 정답에 가까워진다)
   */
  private async evaluateGate(
    userId: string,
    problemId: number,
    context: any,
  ): Promise<{
    blocked: boolean;
    attempts: number;
    required: number;
    message?: string;
  }> {
    const hintCount: number = context?.hint_count ?? 0;
    const attempts = this.countMeaningfulAttempts(context?.logs);
    const gateCap = this.gateCap;
    const gateEscapeMin = this.gateEscapeMin;
    const gateNoEscapeFrom = this.gateNoEscapeFrom;
    const required = Math.min(Math.max(hintCount, 0), gateCap);

    if (!this.gateEnabled) return { blocked: false, attempts, required };

    // 첫 힌트는 항상 열어 준다. 아무 단서도 없이 시도를 요구하는 것은 학습에 도움이 안 된다.
    if (hintCount <= 0) return { blocked: false, attempts, required };

    if (attempts >= required) return { blocked: false, attempts, required };

    // 탈출구: 오래 막혀 있으면 시도 건수와 무관하게 열어 준다.
    // 로그 수집 장애로 영구 차단되는 것을 막고, 타이핑 대신 고민한 학습자도 구제한다.
    // 단 정답 섹션에 닿을 수 있는 구간(hint_count >= GATE_NO_ESCAPE_FROM)에서는
    // 시간으로 열어 주지 않는다. 기다리기만 해서 정답에 도달하는 경로를 막는다.
    const escapeAllowed = hintCount < gateNoEscapeFrom;

    if (escapeAllowed) {
      const lastHint = await this.prisma.hintHistory.findFirst({
        where: { userId, problemId },
        orderBy: { usedAt: 'desc' },
        select: { usedAt: true },
      });
      if (lastHint) {
        const elapsedMin = (Date.now() - lastHint.usedAt.getTime()) / 60000;
        if (elapsedMin >= gateEscapeMin) {
          this.logger.log(
            `게이트 시간 해제 user=${userId} problem=${problemId} ` +
              `attempts=${attempts}/${required} elapsed=${elapsedMin.toFixed(1)}분`,
          );
          return { blocked: false, attempts, required };
        }
      }
    }

    const remaining = required - attempts;
    const tail = escapeAllowed
      ? ` (${gateEscapeMin}분이 지나면 자동으로 열립니다.)`
      : ' 이 단계부터는 시간이 지나도 자동으로 열리지 않습니다.';

    return {
      blocked: true,
      attempts,
      required,
      message:
        `직접 시도한 기록이 ${attempts}건입니다. ` +
        `다음 힌트는 서로 다른 시도가 ${required}건 쌓이면 열립니다. ` +
        `지금까지 받은 힌트를 바탕으로 ${remaining}번만 더 시도해 보세요.` +
        tail,
    };
  }

  async getAiHint(userId: string, problemId: number): Promise<HintResult> {
    const context = await this.getDebugContext(userId, problemId);

    const gate = await this.evaluateGate(userId, problemId, context);
    if (gate.blocked) {
      this.logger.log(
        `힌트 차단 user=${userId} problem=${problemId} ` +
          `attempts=${gate.attempts}/${gate.required}`,
      );
      return {
        gated: true,
        hint: gate.message as string,
        attempts: gate.attempts,
        required: gate.required,
      };
    }

    try {
      const response = await axios.post(`${this.AI_TUTOR_URL}/hint/`, context);
      const aiHint = response.data;

      if (aiHint) {
        await this.createHintRecord(userId, problemId, aiHint);
      }

      return {
        gated: false,
        hint: aiHint,
        attempts: gate.attempts,
        required: gate.required,
      };
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

        // 힌트를 받은 적이 없으면 null 을 보낸다. 예전에는 new Date() 를 채웠는데,
        // 그러면 파이썬 쪽 calculate_level 에서 last_hint_at 이 항상 truthy 가 되어
        // "첫 조회 후 30분 경과" 분기가 죽고, "직전 힌트 후 10분 경과" 도 0분이라
        // 시간 가산점이 사실상 동작하지 않았다. 두 필드 모두 Optional 이다.
        last_hint_at: lastHint ? this.formatDate(lastHint.usedAt) : null,

        // 문자열 'None' 을 보내면 파이썬이 truthy 로 보고 프롬프트에
        // "직전에 제공된 힌트: None, 이것보다 조금만 더 알려주세요." 를 붙인다.
        previous_hint:
          lastHint?.lastHintContent && lastHint.lastHintContent.trim() !== ''
            ? lastHint.lastHintContent
            : null,
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
   *
   * HIDDEN_PROBLEM_IDS 로 숨긴 문제는 추천 결과에서도 제외한다.
   * ChromaDB 에는 그 데이터가 남아 있어서, ai-tutor 가 7번을 추천해도
   * 여기서 걸러 null 로 돌려보낸다.
   */
  async getAiRecommendation(userId: string) {
    const hidden = (process.env.HIDDEN_PROBLEM_IDS ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);

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

      if (hidden.includes(recommendedId)) {
        return {
          recommended_problem_id: null,
          message: '추천할 문제를 찾지 못했습니다.',
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