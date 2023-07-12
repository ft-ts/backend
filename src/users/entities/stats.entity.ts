import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Stats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  user_id: number;

  @Column({ default: 0, nullable: false })
  custom_wins: number;

  @Column({ default: 0, nullable: false })
  custom_losses: number;

  @Column({ default: 0, nullable: false })
  ladder_wins: number;

  @Column({ default: 0, nullable: false })
  ladder_losses: number;

  @Column({ default: 0, nullable: false })
  ladder_level: number;

  @Column({ default: 0, nullable: false })
  ladder_points: number;

  @Column({ default: '' })
  achievements: string;
}
