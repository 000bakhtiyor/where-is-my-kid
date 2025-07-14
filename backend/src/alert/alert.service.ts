import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Alert } from "./entities/alert.entity";

@Injectable()
export class AlertService {
    constructor(
        @InjectRepository(Alert) private alertRepo: Repository<Alert>,
    ) { }

    async createAlert(kidId: string, message: string) {
        const alert = this.alertRepo.create({ kidId, message });
        return this.alertRepo.save(alert);
    }

    async getAlertsForParent(kidIds: string[]) {
        return this.alertRepo.find({
            where: { kidId: In(kidIds) },
            order: { createdAt: 'DESC' },
        });
    }
}
