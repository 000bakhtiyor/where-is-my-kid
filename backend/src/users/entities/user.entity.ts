import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "../enums/roles.enum";

@Entity({
    name: "users"
})
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    fullName: string;

    @Column({
        unique: true,
        nullable: true
    })
    phoneNumber?: string;

    @Column({
        nullable: true
    })
    passwordHash?: string

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.Kid
    })
    role: Role;

    @Column({
        type: 'uuid',
        nullable: true
    })
    parentId?: string

    @ManyToOne(()=> User, (user) => user.kids, {nullable: true, onDelete: "CASCADE"})
    parent?: User;

    @OneToMany(()=> User, (user)=> user.parent)
    kids: User[];

    @Column({type:"varchar" ,nullable: true})
    setupToken: string | null

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}

export { Role };

