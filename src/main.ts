// backend/src/main.ts

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/middleware/filters/all-exceptions.filter';
import { EventsService } from './events/events.service';
import { createOriginGuard } from './common/security/origin-guard';



async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  const eventsService = app.get(EventsService);
  // app.useGlobalFilters(new AllExceptionsFilter(eventsService, app.get('JwtService')));  

  // 기본값은 HTTPS 실서버 오리진 하나. CORS_ORIGINS 로 호환 오리진을 추가한다.
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'https://hackahoy.duckdns.org')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Cookie authentication makes state-changing endpoints CSRF targets. CORS
  // does not block simple cross-origin POSTs, so reject browser mutations from
  // every origin except the tracked frontend before they reach controllers.
  app.use(createOriginGuard(corsOrigins));

  app.enableCors({

    origin: corsOrigins,

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Legacy-Guest-Token',
    ],

  });



  await app.listen(Number(process.env.PORT) || 4000);

  console.log('🚀 Backend running on http://localhost:4000');

}

bootstrap();
