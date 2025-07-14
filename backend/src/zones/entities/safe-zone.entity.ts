import { User } from 'src/users/entities/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';

@Entity()
export class SafeZone {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    parentId: string;

    @Column()
    name: string;

    @Column('float')
    latitude: number;

    @Column('float')
    longitude: number;

    @Column({ type: 'float', default: 50 })
    radius: number;

    @CreateDateColumn()
    createdAt: Date;
}
