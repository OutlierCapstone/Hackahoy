// src/auth/auth.service.ts
import { randomUUID } from 'crypto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

export const MAX_NICKNAME_LENGTH = 20;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  signToken(payload: { userId: string; provider: string }) {
    const expiresIn = (process.env.JWT_EXPIRES_IN ??
      '7d') as JwtSignOptions['expiresIn'];
    return this.jwt.sign(payload, { expiresIn });
  }

  async restoreSessionUser(token: string | null) {
    if (!token) return null;

    try {
      const payload = await this.jwt.verifyAsync<{
        userId?: string;
        provider?: string;
        exp?: number;
      }>(token);
      if (!payload.userId || !payload.provider) return null;

      // Tokens issued before the cookie migration did not expire. Accept those
      // only during the explicit transition window, then make them unusable.
      if (!payload.exp) {
        const deadline = Date.parse(
          process.env.LEGACY_MIGRATION_UNTIL ?? '',
        );
        if (!Number.isFinite(deadline) || Date.now() > deadline) return null;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user || user.isBanned) return null;
      return { user, provider: payload.provider };
    } catch {
      return null;
    }
  }

  async restoreGuestUser(token: string | null) {
    const session = await this.restoreSessionUser(token);
    return session?.provider === 'guest' && session.user.provider === 'GUEST'
      ? session.user
      : null;
  }

  async upsertSocialUser(params: {
    provider: 'KAKAO' | 'GOOGLE' | 'NAVER';
    providerId: string;
    nickname: string;
  }) {
    const user = await this.prisma.user.upsert({
      where: {
        provider_providerId: {
          provider: params.provider,
          providerId: params.providerId,
        },
      },
      update: {},
      create: {
        provider: params.provider,
        providerId: params.providerId,
        nickname: params.nickname,
      },
    });

    // BanHistory 테이블에서 현재 유효한 차단 기록이 있는지 확인
    const activeBan = await this.prisma.banHistory.findFirst({
      where: {
        userId: user.id,
        releasedAt: { gt: new Date() }, // 현재 시간보다 해제 시간이 미래인 경우
      },
      orderBy: { bannedAt: 'desc' },
    });

    // 1. 자동 차단 기록이 있거나, 2. 수동 차단(isBanned) 상태인 경우 처리
    if (activeBan || user.isBanned) {
      throw new ForbiddenException({
        error: 'BANNED_USER',
        message: '이용이 제한된 계정입니다.',
        reason: activeBan?.reason || '관리자에 의한 수동 차단',
        releasedAt: activeBan?.releasedAt || '영구 차단',
        type: 'BANNED',
      });
    }

    return user;
  }

  // 비회원(게스트) 유저 생성. 소셜 로그인 없이 User 레코드를 만든다.
  // providerId 는 재사용하지 않는다 — 프론트가 localStorage 토큰을 재사용해
  // 같은 게스트로 돌아오고, 토큰이 없을 때만 이 메서드가 호출된다.
  async createGuestUser() {
    const providerId = randomUUID();

    return this.prisma.user.create({
      data: {
        provider: 'GUEST',
        providerId,
        nickname: `게스트-${providerId.slice(0, 4)}`,
      },
    });
  }

  // Mypage 정보 조회
  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        levelNum: true,
        provider: true,
        providerId: true,
        isAdmin: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        level: { select: { levelNum: true, shipImage: true } },
      },
    });

    const solved = await this.prisma.solvedHistory.findMany({
      where: { userId },
      select: {
        solvedAt: true,
        problem: { select: { id: true, islandId: true, title: true } },
      },
      orderBy: { solvedAt: 'desc' },
    });

    return { user, solved };
  }

  // 닉네임 수정
  async updateNickname(userId: string, newNickname: string) {
    const nickname = (newNickname ?? '').trim();
    if (!nickname) {
      throw new BadRequestException('닉네임을 입력해 주세요.');
    }
    if (nickname.length > MAX_NICKNAME_LENGTH) {
      throw new BadRequestException(
        `닉네임은 ${MAX_NICKNAME_LENGTH}자 이하로 입력해 주세요.`,
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { nickname },
      select: {
        id: true,
        nickname: true,
        levelNum: true,
        isAdmin: true,
        provider: true,
        providerId: true,
      },
    });
  }

  // 회원 탈퇴
  async deleteUserAccount(userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.submitFlag.deleteMany({ where: { userId } });
        await tx.solvedHistory.deleteMany({ where: { userId } });
        await tx.userEvent.deleteMany({ where: { userId } });
        await tx.hintHistory.deleteMany({ where: { userId } });
        await tx.userLog.deleteMany({ where: { userId } });
        await tx.banHistory.deleteMany({ where: { userId } });
        return await tx.user.delete({ where: { id: userId } });
      });
    } catch (error) {
      console.error('DB 유저 삭제 중 에러 발생:', error);
      throw error;
    }
  }

  // 관리자 - 유저 목록 조회
  async findAllUsers(keyword?: string) {
    return this.prisma.user.findMany({
      where: keyword
        ? {
            OR: [
              { nickname: { contains: keyword } },
              { id: { contains: keyword } },
            ],
          }
        : {},
      select: {
        id: true,
        nickname: true,
        isAdmin: true,
        isBanned: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 관리자 - 유저 차단 상태 변경
  async updateBanStatus(userId: string, isBanned: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBanned },
    });
  }

  // 관리자 - 여러 유저 상태 일괄 업데이트 및 차단 해제 로직
  async batchUpdateUsers(users: any[]) {
    return this.prisma.$transaction(
      users
        .map((u) => {
          // 1. 유저 기본 정보 업데이트
          const userUpdate = this.prisma.user.update({
            where: { id: u.id },
            data: {
              isAdmin: u.role === 'ADMIN',
              isBanned: u.banned,
            },
          });

          // 2. 차단 해제(banned: false) 시 BanHistory의 남은 기간 초기화
          if (u.banned === false) {
            return [
              userUpdate,
              this.prisma.banHistory.updateMany({
                where: {
                  userId: u.id,
                  releasedAt: { gt: new Date() },
                },
                data: {
                  releasedAt: new Date(),
                },
              }),
            ];
          }

          return userUpdate;
        })
        .flat(),
    );
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        levelNum: true,
        isAdmin: true,
        provider: true,
        providerId: true,
      },
    });

    if (!user) return null;

    return {
      userId: user.id,
      nickname: user.nickname,
      levelNum: user.levelNum,
      isAdmin: user.isAdmin,
      provider: user.provider,
      providerId: user.providerId,
    };
  }
}
