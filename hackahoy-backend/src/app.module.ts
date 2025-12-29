// backend/src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { IslandsModule } from './islands/islands.module';
import { ProblemModule } from './problem/problem.module';
import { AdminController } from './admin/admin.controller';

// 1. 보안 로그 미들웨어 임포트
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    PrismaModule,
    IslandsModule,
    ProblemModule,
  ],
  controllers: [AppController, AdminController],
  providers: [AppService],
})
// 2. NestModule 인터페이스를 구현(implements)하도록 수정
export class AppModule implements NestModule {
  // 3. configure 함수를 추가하여 미들웨어가 모든 경로('*')를 감시하게 설정
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
