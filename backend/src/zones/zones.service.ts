import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SafeZone } from './entities/safe-zone.entity';
import { Repository } from 'typeorm';
import { CreateSafeZoneDto } from './dto/create-safe-zone.dto';

@Injectable()
export class ZonesService {
    constructor(
        @InjectRepository(SafeZone)
        private zoneRepo: Repository<SafeZone>,
    ) { }

    async create(parentId: string, dto: CreateSafeZoneDto) {
        const zone = this.zoneRepo.create({ ...dto, parentId });
        return this.zoneRepo.save(zone);
    }

    async findAllForParent(parentId: string) {
        return this.zoneRepo.find({ where: { parentId } });
    }

    async remove(id: string, parentId: string) {
        const zone = await this.zoneRepo.findOne({ where: { id, parentId } });
        if (!zone) return null;
        return this.zoneRepo.remove(zone);
    }

    async checkIfInZone(kidLat: number, kidLng: number, parentId: string){

        const zones = await this.findAllForParent(parentId)
        for( const zone of zones){
            const dist = this.calculateDistance(kidLat, kidLng, zone.latitude, zone.longitude);
            if(dist <= zone.radius){
                return {
                    inside: true,
                    zone
                }
            }
            return {
                inside: false,
                zone: null
            }
        }
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
