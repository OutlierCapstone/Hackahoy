import type { NextFunction, Request, Response } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function createOriginGuard(allowedOrigins: string[]) {
  const allowed = new Set(allowedOrigins);

  return (request: Request, response: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(request.method.toUpperCase())) return next();

    const origin = request.headers.origin;
    // Server-to-server clients such as the internal challenge log collector do
    // not send Origin. Browser mutations do, including same-site subdomains.
    if (!origin || allowed.has(origin)) return next();

    return response.status(403).json({
      statusCode: 403,
      message: 'Request origin is not allowed',
    });
  };
}
