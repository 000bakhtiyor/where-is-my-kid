import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsPhoneNumber, IsString, IsStrongPassword } from "class-validator";

export class CreateParentDto {

    @ApiProperty({
        example: "Aliyev Vali"
    })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({
        example: "+998901234567"
    })
    @IsPhoneNumber('UZ')
    phoneNumber: string

    @IsStrongPassword({
        minLength: 8,
        minNumbers: 1,
        minLowercase: 1,
        minSymbols: 1,
        minUppercase: 1
    })
    password: string
}
