import { createOriginGuard } from './origin-guard';

function run(method: string, origin?: string) {
  const next = jest.fn();
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const guard = createOriginGuard([
    'https://hackahoy.duckdns.org',
    'http://100.114.171.77:8080',
  ]);

  guard({ method, headers: { origin } } as any, { status } as any, next);
  return { next, status, json };
}

describe('origin guard', () => {
  it('allows browser mutations from the frontend origin', () => {
    expect(run('POST', 'https://hackahoy.duckdns.org').next).toHaveBeenCalled();
  });

  it('allows browser mutations from an explicitly configured Tailscale IP origin', () => {
    expect(run('POST', 'http://100.114.171.77:8080').next).toHaveBeenCalled();
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
