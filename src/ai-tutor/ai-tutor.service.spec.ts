import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { AiTutorService } from './ai-tutor.service';

describe('AiTutorService.getAiHint', () => {
  it('turns an upstream timeout into a bounded gateway timeout', async () => {
    const config = {
      get: jest.fn((key: string, fallback?: string) =>
        key === 'AI_TUTOR_TIMEOUT_MS' ? '5' : fallback,
      ),
    } as any;
    const service = new AiTutorService({} as any, config);
    jest
      .spyOn(service as any, 'getDebugContext')
      .mockResolvedValue({ hint_count: 0, logs: [] });
    jest.spyOn(axios, 'post').mockRejectedValue({
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout',
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      await service.getAiHint('user-1', 1);
      throw new Error('expected getAiHint to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }
  });
});
