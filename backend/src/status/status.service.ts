import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { KidStatus } from "./entities/status.entity";
import { UsersService } from "src/users/users.service";

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(KidStatus) private repo: Repository<KidStatus>,
    private userService: UsersService
  ) { }

  async markSafe(kidId: string) {
    let status = await this.repo.findOne({ where: { kidId: kidId } });
    if (!status) {
      status = this.repo.create({ kidId });
    }

    status.isSafe = true;
    status.updatedAt = new Date();
    return this.repo.save(status);
  }

  async getAllStatuses(parentId: string) {
    const kids = await this.userService.getParentKids(parentId);
    const kidIds = kids.map(k => k.id);
    return this.repo.find({ where: { kidId: In(kidIds) } });
  }
}
