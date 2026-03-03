import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'rexyloop@gmail.com', // 🔴 내 지메일 주소 (수정)
        pass: 'enga ydaf eudb hqnk', // 🔴 방금 받은 앱 비밀번호 16자리 (수정)
      },
    });
  }

  // 이메일 보내는 함수a
  async sendSecurityAlert(ip: string, email: string) {
    try {
      await this.transporter.sendMail({
        from: '"Hackahoy 보안팀" <rexyloop@gmail.com>', // 보내는 사람
        to: 'mseo2004@naver.com', // 🔴 알림을 받을 메일 주소 (수정)
        subject: '🚨 보안 경고: 자동 차단 발생',
        text: `시스템이 보안 위협을 감지했습니다.\n\n차단 IP: ${ip}\n시도 계정: ${email}\n사유: 로그인 5회 실패로 인한 자동 차단`,
      });
      console.log('✅ [이메일 전송 성공] 관리자에게 보안 알림을 보냈습니다.');
    } catch (error) {
      console.error('❌ [이메일 전송 실패]', error);
    }
  }
  async sendDailyReportMail(nickname: string, stats: any, details: string) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await this.transporter.sendMail({
      from: '"Hackahoy 보안팀" <rexyloop@gmail.com>',
      to: 'mseo2004@naver.com',
      subject: `[Hackahoy] 일일 보안 차단 리포트 (${today})`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2>안녕하세요, 관리자님.</h2>
          <p>지난 24시간 동안의 자동 차단 현황을 보고합니다.</p>
          
          <h3>1. 요약 통계</h3>
          <ul>
            <li><strong>총 차단 건수:</strong> ${stats.totalCount}건</li>
          </ul>
          
          <h3>2. 상세 내역</h3>
          <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${details}</pre>
          
          <h3>3. 관리자 조치</h3>
          <p>아래 버튼을 눌러 상세 로그를 확인하세요.</p>
          <a href="http://localhost:3000/admin/notifications" 
             style="display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">
             관리자 페이지 바로가기
          </a>
        </div>
      `,
    });
    console.log('✅ [이메일] 일일 리포트 전송 성공');
  } catch (error) {
    console.error('❌ [이메일] 리포트 전송 실패', error);
  }
}
}