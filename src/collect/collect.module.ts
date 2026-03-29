import { Module } from '@nestjs/common';
import { CollectController } from './collect.controller';
import { CollectService } from './collect.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),  // decode만 쓰므로 secret 불필요
  ],
  controllers: [CollectController],
  providers: [CollectService],
})
export class CollectModule {}