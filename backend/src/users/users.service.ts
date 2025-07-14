import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from './enums/roles.enum';
import { createKidDto } from './dto/create-kid.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) { }

  async createParent(data: Partial<User>) {
    return this.userRepo.save({
      ...data,
      role: Role.Parent,
    });
  }

  async createKid(dto: createKidDto) {
    const token = randomUUID();

    return this.userRepo.save({
      fullName: dto.fullName,
      parentId: dto.parentId,
      role: Role.Kid,
      setupToken: token,
    });
  }

  async getParentKids(parentId: string) {
    return this.userRepo.find({
      where: { parentId },
    });
  }

  async findByPhone(phone: string) {
    return this.userRepo.findOne({
      where: { phoneNumber: phone },
    });
  }

  async findById(id: string) {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByToken(token: string) {
    return this.userRepo.findOne({
      where: {
        setupToken: token,
        role: Role.Kid,
      },
    });
  }

  async clearKidToken(id: string) {
    await this.userRepo.update({ id }, { setupToken: null });
  }
}
