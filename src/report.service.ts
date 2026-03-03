import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // @Cron('0 0 0 * * *') // 매일 자정에 실행
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // 매일 자정에 실행 (대체 표현)
  async sendDailyBanReport() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const banList = await this.prisma.banHistory.findMany({
      where: { bannedAt: { gte: oneDayAgo } },
      include: { user: true },
    });

    if (banList.length === 0) {
      console.log('✅ [REPORT] 최근 24시간 동안 차단된 사용자가 없습니다.');
      return;
    }

    // 1. 요약 통계 계산
    const totalCount = banList.length;

    // 2. 상세 내역 생성
    const details = banList
      .map((b) => `• ${b.user?.nickname || 'GUEST'} - ${b.reason} - 24시간 정지`)
      .join('\n');

    // 3. 메일 발송 (관리자 닉네임: 김민서)
    await this.emailService.sendDailyReportMail(
      '김민서', 
      { totalCount}, 
      details
    );
    
    console.log('✅ [REPORT] 커스텀 보안 리포트 발송 완료');
  }
}