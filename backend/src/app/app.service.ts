import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class AppService {

    constructor(
        private configService: ConfigService
    ){}

    createTypeOrmOptions(): TypeOrmModuleOptions {
        return {
            type: 'postgres',
            host: this.configService.getOrThrow('DB_HOST'),
            username: this.configService.getOrThrow('DB_USERNAME'),
            password: this.configService.getOrThrow('DB_PASSWORD'),
            database: this.configService.getOrThrow('DB_NAME'),
            port: this.configService.getOrThrow<number>('DB_PORT') ?? 5432,
            synchronize: true,
            autoLoadEntities: true
        }
    }
}
