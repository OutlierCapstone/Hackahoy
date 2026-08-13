import { redactSensitiveResponse } from './sensitive-fields.interceptor';

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
});
