import { Module } from '@nestjs/common';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafeZone } from './entities/safe-zone.entity';

@Module({
  imports:[TypeOrmModule.forFeature([SafeZone])],
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService]
})
export class ZonesModule {}
