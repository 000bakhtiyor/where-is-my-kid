import { Role } from "../enums/roles.enum";

export class UserResponseDto {

    id: string;
    fullName: string;
    phoneNumber?: string;
    role: Role;
    parentId?: string;
    createdAt: Date;
    updatedAt: Date;
}