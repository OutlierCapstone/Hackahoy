import { Module } from '@nestjs/common';
import { IslandsController } from './islands.controller';
import { IslandsService } from './islands.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [IslandsController],
  providers: [IslandsService, PrismaService],
})
export class IslandsModule {}
