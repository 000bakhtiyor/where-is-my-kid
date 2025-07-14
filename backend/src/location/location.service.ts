import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateLocationDto } from "./dto/create-location.dto";
import { Location } from "./entities/location.entity";
import { ZonesService } from "src/zones/zones.service";
import { User } from "src/users/entities/user.entity";
import { UsersService } from "src/users/users.service";

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private locationRepo: Repository<Location>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private safeZoneService: ZonesService,
    private usersService: UsersService
  ) { }

  async getLatestLocation(kidId: string) {
    return this.locationRepo.findOne({
      where: { kidId },
      order: { createdAt: 'DESC' },
    });
  }

  async getLatestLocationsForParent(kidIds: string[]) {
    const latest = await Promise.all(
      kidIds.map(async (kidId) => {
        const location = await this.getLatestLocation(kidId);
        if (!location) return null;

        const kid = await this.usersService.findById(kidId);
        if (!kid) return null;
        
        return {
          ...location,
          fullName: kid.fullName,
        };
      }),
    );

    return latest.filter((loc) => loc !== null);
  }


  async saveLocation(kidId: string, dto: CreateLocationDto) {
    const kid = await this.userRepo.findOne({ where: { id: kidId } });
    if (!kid) throw new Error('Kid not found');

    const location = this.locationRepo.create({ ...dto, kidId });
    await this.locationRepo.save(location);

    if (!kid?.parentId) {
      throw new Error(`Kid with id ${kidId} does not have a parent assigned`);
    }

    const alert = await this.safeZoneService.checkIfInZone(
      dto.latitude,
      dto.longitude,
      kid.parentId,
    );

    if (alert && !alert.inside) {
      console.log(`🚨 ALERT: Kid (${kid.fullName}) is OUTSIDE safe zone!`);
      // You can also notify parent here via AlertService, WebSocket, etc.
    }

    return location;
  }
}
