import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Alert {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    message: string;

    @Column()
    kidId: string;

    @ManyToOne(() => User)
    kid: User;

    @CreateDateColumn()
    createdAt: Date;
}
