import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, Max, Min } from "class-validator";

export class CreateSafeZoneDto {
    @ApiProperty({
        example: 'Home',
        description: 'The name of the safe zone (e.g. Home, School)',
    })
    @IsString()
    name: string;

    @ApiProperty({
        example: 41.311081,
        description: 'Latitude coordinate of the center point',
    })
    @IsNumber()
    latitude: number;

    @ApiProperty({
        example: 69.279716,
        description: 'Longitude coordinate of the center point',
    })
    @IsNumber()
    longitude: number;

    @ApiProperty({
        example: 200,
        description: 'Radius of the safe zone in meters',
    })
    @IsNumber()
    @Min(10)
    @Max(10000)
    radius: number;
}
