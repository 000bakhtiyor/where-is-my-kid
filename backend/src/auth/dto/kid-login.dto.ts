import { IsUUID } from "class-validator";

export class KidLoginDto {

    @IsUUID()
    setupToken: string;
}