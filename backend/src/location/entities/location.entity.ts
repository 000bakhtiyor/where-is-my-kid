import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity()
export class Location {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    kidId: string;

    @Column('float')
    latitude: number;

    @Column('float')
    longitude: number;

    @CreateDateColumn()
    createdAt: Date;
}
