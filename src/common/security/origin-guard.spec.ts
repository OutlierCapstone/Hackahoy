import { createOriginGuard } from './origin-guard';

function run(method: string, origin?: string) {
  const next = jest.fn();
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const guard = createOriginGuard(['https://hackahoy.duckdns.org']);

  guard({ method, headers: { origin } } as any, { status } as any, next);
  return { next, status, json };
}

describe('origin guard', () => {
  it('allows browser mutations from the frontend origin', () => {
    expect(run('POST', 'https://hackahoy.duckdns.org').next).toHaveBeenCalled();
  });

  it('blocks mutations from challenge subdomains', () => {
    const result = run('POST', 'https://challenge-1.hackahoy.duckdns.org');
    expect(result.next).not.toHaveBeenCalled();
    expect(result.status).toHaveBeenCalledWith(403);
  });

  it('allows server-to-server mutations without an Origin header', () => {
    expect(run('POST').next).toHaveBeenCalled();
  });

  it('allows safe reads regardless of Origin', () => {
    expect(
      run('GET', 'https://challenge-1.hackahoy.duckdns.org').next,
    ).toHaveBeenCalled();
  });
});
