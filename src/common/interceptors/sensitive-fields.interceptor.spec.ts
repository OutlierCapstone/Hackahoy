import { redactSensitiveResponse } from './sensitive-fields.interceptor';
import { SensitiveFieldsInterceptor } from './sensitive-fields.interceptor';
import { firstValueFrom, of } from 'rxjs';

describe('redactSensitiveResponse', () => {
  it('removes flag fields recursively', () => {
    expect(
      redactSensitiveResponse({
        id: 1,
        correctFlag: 'hackahoy{secret}',
        nested: [{ submitted_flag: 'wrong', title: 'safe' }],
      }),
    ).toEqual({ id: 1, nested: [{ title: 'safe' }] });
  });

  it('redacts flag-shaped strings even under an unexpected key', () => {
    expect(
      redactSensitiveResponse({ hint: 'try hackahoy{secret} now' }),
    ).toEqual({ hint: 'try hackahoy{[REDACTED]} now' });
  });

  it('marks API responses as non-cacheable', async () => {
    const setHeader = jest.fn();
    const context = {
      switchToHttp: () => ({ getResponse: () => ({ setHeader }) }),
    } as any;
    const interceptor = new SensitiveFieldsInterceptor();

    await firstValueFrom(
      interceptor.intercept(context, { handle: () => of({ ok: true }) }),
    );

    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });
});
