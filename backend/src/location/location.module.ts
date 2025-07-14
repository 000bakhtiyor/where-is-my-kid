import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { UsersModule } from 'src/users/users.module';
import { ZonesModule } from 'src/zones/zones.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, User]), UsersModule, ZonesModule],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule {}
