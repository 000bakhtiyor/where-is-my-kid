import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class createKidDto {

    @ApiProperty({
            example: "Aliyev Vali"
        })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsUUID()
    @IsNotEmpty()
    parentId: string
}