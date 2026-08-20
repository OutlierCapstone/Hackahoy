import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core'; 
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { IslandsModule } from './islands/islands.module';
import { ProblemModule } from './problem/problem.module';
import { AdminController } from './admin/admin.controller';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ChallengeModule } from './challenges/challenges.module';
import { EmailService } from './email.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportService } from './report.service';
import { APP_GUARD } from '@nestjs/core';
import { LoginThrottlerGuard } from './login-throttler.guard';
import { BanModule } from './ban/ban.module';
import { EventsModule } from './events/events.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/middleware/filters/all-exceptions.filter';
import { JwtModule } from '@nestjs/jwt';
import { BanCheckGuard } from './common/guard/ban-check.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CollectModule } from './collect/collect.module';
import { AiTutorModule } from './ai-tutor/ai-tutor.module';
import { SensitiveFieldsInterceptor } from './common/interceptors/sensitive-fields.interceptor';
import { SecurityInterceptor } from './interceptors/security.interceptor';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([
    {
      name: 'default',
      ttl: 300000, // 5분
      limit: 600,  // 일반 요청
    },
    {
      name: 'login',
      ttl: 300000, // 5분
      limit: 20,   // 👈 로그인 시도는 20번으로 제한!
    }
  ]),
  JwtModule.register({ secret: process.env.JWT_SECRET }),
    AuthModule, PrismaModule, IslandsModule, ProblemModule, ChallengeModule, BanModule, EventsModule, CollectModule, AiTutorModule
  ],
  controllers: [AppController, AdminController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SensitiveFieldsInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,  
    },
    {
      provide: APP_GUARD,
      useClass: BanCheckGuard,
    },

    {
      provide: APP_GUARD,
      useClass: LoginThrottlerGuard,  
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },        
    AppService,
    EmailService,
    ReportService,

    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
