import { Controller, Post, Body, Logger, Req } from '@nestjs/common';
import { CollectService } from './collect.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('api/collect')
export class CollectController {
  private readonly logger = new Logger('CollectController');

  constructor(private readonly collectService: CollectService) {}

  @Post()
  @SkipThrottle() // 속도 제한 제외
  async collectData(@Body() data: any, @Req() req: any) {
    this.logger.log('--- Nginx Data Captured ---');

    // 1. Nginx(Snake Case) -> Service(Camel Case) 데이터 매핑
    // 서비스에서 'userId'가 없으면 에러를 내기 때문에 여기서 이름을 맞춰주는 게 핵심입니다.
    const mappedData = {
      userId: data.user_id,      // 'cmm0uz...' 값 매핑
      problemId: Number(data.problem_id),
      method: data.method || 'GET',
      uri: data.uri || '',
      payload: data.payload || '', // GET 요청일 땐 빈 문자열
      headers: data.headers || {}
    };

    // 2. 터미널 디버깅용 로그 (데이터가 제대로 변환됐는지 확인)
    console.log('--- [DEBUG] Mapped Data ---');
    console.log('ID Check:', mappedData.userId);
    console.log('URI:', mappedData.uri);
    console.log('Payload Length:', mappedData.payload.length);

    try {
      // 3. 서비스로 전달하여 DB 저장
      return await this.collectService.saveLog(mappedData);
    } catch (error) {
      this.logger.error('Log storage failed', error.stack);
      return { status: 'error', message: 'Internal Server Error' };
    }
  }
}