import { Module } from '@nestjs/common';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KidStatus } from './entities/status.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([KidStatus]), UsersModule],
  controllers: [StatusController],
  providers: [StatusService],
})
export class StatusModule {}
