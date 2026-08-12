// backend/src/main.ts

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/middleware/filters/all-exceptions.filter';
import { EventsService } from './events/events.service';



async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  const eventsService = app.get(EventsService);
  // app.useGlobalFilters(new AllExceptionsFilter(eventsService, app.get('JwtService')));  

  // 기본값은 기존 실서버 오리진 하나. CORS_ORIGINS 로 로컬 개발 오리진만 추가한다.
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://44.199.70.243:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({

    origin: corsOrigins,

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization'],

  });



  await app.listen(Number(process.env.PORT) || 4000);

  console.log('🚀 Backend running on http://localhost:4000');

}

bootstrap();