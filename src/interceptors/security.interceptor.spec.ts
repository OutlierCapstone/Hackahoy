import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { SecurityInterceptor } from './security.interceptor';

function run(method: string, body?: unknown) {
  const interceptor = new SecurityInterceptor();
  const handle = jest.fn(() => of({ ok: true }));
  const context = {
    switchToHttp: () => ({ getRequest: () => ({ method, body }) }),
  } as unknown as ExecutionContext;

  return {
    handle,
    invoke: () => interceptor.intercept(context, { handle }),
  };
}

describe('SecurityInterceptor', () => {
  it('allows safe mutation bodies', () => {
    const request = run('POST', { answer: 'safe input' });

    expect(request.invoke()).toBeDefined();
    expect(request.handle).toHaveBeenCalledTimes(1);
  });

  it('blocks the existing mutation danger-word patterns', () => {
    for (const payload of [
      '<script>alert(1)</script>',
      'select * from users',
      'drop table users',
      'union select password',
    ]) {
      const request = run('POST', { payload });

      expect(request.invoke).toThrow(new BadRequestException('보안 위협 감지'));
      expect(request.handle).not.toHaveBeenCalled();
    }
  });

  it('preserves the existing GET bypass', () => {
    const request = run('GET', { payload: '<script>' });

    expect(request.invoke()).toBeDefined();
    expect(request.handle).toHaveBeenCalledTimes(1);
  });
});
