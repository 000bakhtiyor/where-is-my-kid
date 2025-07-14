import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class KidStatus {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    kidId: string;

    @Column({ default: false })
    isSafe: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt: Date;
}
