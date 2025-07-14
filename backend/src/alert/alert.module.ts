import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { UsersModule } from 'src/users/users.module';
import { LocationModule } from 'src/location/location.module';

@Module({
  imports: [TypeOrmModule.forFeature([Alert]), UsersModule, LocationModule],
  controllers: [AlertController],
  providers: [AlertService],
})
export class AlertModule {}
