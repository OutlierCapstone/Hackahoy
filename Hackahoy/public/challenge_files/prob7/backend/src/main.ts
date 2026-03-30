import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // ✅ 프론트에서 요청 허용

  await app.listen(4007);
}
bootstrap();
