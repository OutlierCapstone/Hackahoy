import { Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { EventEmitter } from 'node:events';
import { LoggerMiddleware } from './logger.middleware';

type ResponseStub = EventEmitter & { statusCode: number };

function runMiddleware(statusCode: number) {
  const middleware = new LoggerMiddleware();
  const req = {
    ip: '127.0.0.1',
    method: 'GET',
    originalUrl: '/missing',
    get: jest.fn().mockReturnValue('test-agent'),
  };
  const res = new EventEmitter() as ResponseStub;
  res.statusCode = statusCode;
  const next = jest.fn();

  middleware.use(req as unknown as Request, res as unknown as Response, next);
  res.emit('finish');

  return { next };
}

describe('LoggerMiddleware', () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs successful responses at info level', () => {
    const { next } = runMiddleware(200);

    expect(next).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      '[GET] /missing 200 - IP: 127.0.0.1 - UA: test-agent',
    );
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('logs client errors as ordinary HTTP warnings', () => {
    runMiddleware(404);

    expect(warnSpy).toHaveBeenCalledWith(
      '[GET] /missing 404 - IP: 127.0.0.1 - UA: test-agent',
    );
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('보안 위협'),
    );
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('logs server errors at error level', () => {
    runMiddleware(500);

    expect(errorSpy).toHaveBeenCalledWith(
      '[GET] /missing 500 - IP: 127.0.0.1 - UA: test-agent',
    );
    expect(warnSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });
});
