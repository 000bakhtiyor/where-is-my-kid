import { Module } from '@nestjs/common';
import { JwtConfigModule } from './jwt-config/jwt-config.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app/app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LocationModule } from './location/location.module';
import { ZonesModule } from './zones/zones.module';
import { StatusModule } from './status/status.module';
import { AlertModule } from './alert/alert.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: AppService }),
    JwtConfigModule, 
    UsersModule,
    AuthModule,
    LocationModule,
    ZonesModule,
    StatusModule,
    AlertModule,
  ],
})
export class AppModule { }
