// src/collect/collect.service.ts
//
// 변경 요약
//   1) UserLog 저장 시 query / status / respBytes / elapsedMs 를 함께 기록.
//   2) 거부/실패 사유를 reason 코드로 돌려준다.
//      이 응답은 nginx 의 log_by_lua 가 읽어서 error.log 에 남긴다.
//      (예전에는 HTTP 200 + success:false 를 nginx 가 무시해서 유실이 조용히 일어났다)
//   3) problemId 가 유효하지 않으면 FK 위반이 뻔한 insert 를 시도하지 않고 바로 거부한다.
//      UserLog.problemId 는 Problem 에 대한 필수 FK 이므로 0 이면 P2003 으로 죽는다.

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CollectService {
  private readonly logger = new Logger('CollectService');

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async saveLog(data: any) {
    try {
      let targetUserId = data.userId || data.user_id;

      // Bearer 제거
      if (targetUserId && targetUserId.startsWith('Bearer ')) {
        targetUserId = targetUserId.replace('Bearer ', '');
      }

      // JWT decode
      if (targetUserId && targetUserId.includes('.')) {
        try {
          const decoded = this.jwtService.decode(targetUserId) as any;
          targetUserId =
            decoded?.userId || decoded?.sub || decoded?.id || targetUserId;
        } catch (e) {
          this.logger.warn(`JWT 파싱 실패: ${e.message}`);
        }
      }

      if (!targetUserId || targetUserId === 'anonymous') {
        this.logger.warn(
          `[거부] uid 없음 (${targetUserId}) uri=${data.uri} — ` +
            `/set-uid 를 거치지 않았거나 다른 오리진으로 접속한 경우다`,
        );
        return {
          success: false,
          reason: 'NO_UID',
          error: 'Invalid User ID',
        };
      }

      // problemId 검증.
      // nginx 의 prob_id map 에 없는 포트로 들어오면 0 이 넘어오는데,
      // 그대로 insert 하면 Problem FK 위반(P2003)으로 죽고 catch 에 묻힌다.
      const problemId = Number(data.problemId);
      if (!Number.isInteger(problemId) || problemId <= 0) {
        this.logger.warn(
          `[거부] problemId 이상 (${data.problemId}) uri=${data.uri} — ` +
            `nginx.conf 의 map $server_port $prob_id 확인 필요`,
        );
        return {
          success: false,
          reason: 'INVALID_PROBLEM_ID',
          error: `Invalid problemId: ${data.problemId}`,
        };
      }

      let parsedPayload: any = {};
      try {
        if (typeof data.payload === 'string' && data.payload.trim() !== '') {
          parsedPayload = JSON.parse(data.payload);
        } else {
          parsedPayload = data.payload || {};
        }
      } catch (e) {
        parsedPayload = { raw: data.payload };
      }

      const method = (data.method || 'UNKNOWN').toUpperCase();
      const path = data.uri || '/';
      const requestLine = `${method} ${path}`;

      const newLog = await this.prisma.userLog.create({
        data: {
          userId: targetUserId,
          problemId,
          header: { request: requestLine },
          body: parsedPayload,
          query: data.query || null,
          status: Number.isFinite(data.status) ? data.status : null,
          respBytes: Number.isFinite(data.respBytes) ? data.respBytes : null,
          elapsedMs: Number.isFinite(data.elapsedMs) ? data.elapsedMs : null,
        },
      });

      return { success: true, logId: newLog.id.toString() };
    } catch (error: any) {
      // FK 위반은 "로그가 그냥 안 쌓인다" 로만 보이던 대표적 원인이라 따로 구분한다.
      if (error?.code === 'P2003') {
        this.logger.error(
          `[거부] FK 위반 userId=${data.userId} problemId=${data.problemId} uri=${data.uri} — ` +
            `User 또는 Problem 레코드가 존재하지 않는다`,
        );
        return {
          success: false,
          reason: 'FK_VIOLATION',
          error: error.message,
        };
      }

      this.logger.error(
        `[실패] 저장 실패 userId=${data.userId} problemId=${data.problemId} uri=${data.uri}`,
      );
      this.logger.error(`에러: ${error.message}`);
      return { success: false, reason: 'DB_ERROR', error: error.message };
    }
  }
}
