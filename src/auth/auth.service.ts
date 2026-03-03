// src/auth/auth.service.ts
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  signToken(payload: { userId: string; provider: string }) {
    return this.jwt.sign(payload);
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
    if (user.isBanned) {
      // 여기서 에러를 던져야 프론트에서 모달을 띄울 수 있음!
      throw new ForbiddenException({
        message: '차단된 계정입니다.',
        reason: '규정 위반 (반복된 에러 발생)',
        type: 'BANNED'
      });
    }

    // 🔥 [추가] BanHistory 테이블에서 현재 유효한 차단 기록이 있는지 확인
    const activeBan = await this.prisma.banHistory.findFirst({
      where: {
        userId: user.id,
        releasedAt: { gt: new Date() }, // 현재 시간보다 해제 시간이 미래인 경우
      },
      orderBy: { bannedAt: 'desc' }, // 가장 최근 기록 하나만
    });

    // 1. 자동 차단 기록이 있거나, 2. 수동 차단(isBanned) 상태인 경우
    if (activeBan || user.isBanned) {
      throw new ForbiddenException({
        error: 'BANNED_USER',
        message: '이용이 제한된 계정입니다.',
        reason: activeBan?.reason || '관리자에 의한 수동 차단',
        releasedAt: activeBan?.releasedAt || '영구 차단',
      });
    }

    return user;
  }

  // Mypage
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
    return this.prisma.user.update({
      where: { id: userId },
      data: { nickname: newNickname },
    });
  }

  // 회원 탈퇴
  async deleteUserAccount(userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        
        // SubmitFlag 삭제
        await tx.submitFlag.deleteMany({
          where: { userId: userId },
        });

        // SolvedHistory 삭제
        await tx.solvedHistory.deleteMany({
          where: { userId: userId },
        });

        // 유저 본인 삭제
        return await tx.user.delete({
          where: { id: userId },
        });
      });
    } catch (error) {
      console.error("DB 유저 삭제 중 에러 발생:", error);
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

<<<<<<< HEAD
=======
  /*
>>>>>>> 18190ce (feat: implement user unban logic and automated daily security report)
  async batchUpdateUsers(users: any[]) {
    // 유저 상태 업데이트
    return this.prisma.$transaction(
      users.map((u) =>
        this.prisma.user.update({
          where: { id: u.id },
          data: {
            isAdmin: u.role === 'ADMIN',
            isBanned: u.banned,
          },
        }),
      ),
    );
  }
<<<<<<< HEAD
=======
  */

  async batchUpdateUsers(users: any[]) {
    return this.prisma.$transaction(
      users.map((u) => {
        // 1. 유저 정보 업데이트
        const userUpdate = this.prisma.user.update({
          where: { id: u.id },
          data: {
            isAdmin: u.role === 'ADMIN',
            isBanned: u.banned,
          },
        });

        // 2. 만약 차단을 해제(banned: false)하는 경우라면 BanHistory도 정리
        if (u.banned === false) {
          return [
            userUpdate,
            this.prisma.banHistory.updateMany({
              where: {
                userId: u.id,
                releasedAt: { gt: new Date() }, // 아직 차단 기간이 남은 기록들
              },
              data: {
                releasedAt: new Date(), // 해제 시간을 지금으로 변경
              },
            }),
          ];
        }

        return userUpdate;
      }).flat() // 중첩된 배열을 평탄화하여 트랜잭션 실행
    );
  }

>>>>>>> 18190ce (feat: implement user unban logic and automated daily security report)
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
      }
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