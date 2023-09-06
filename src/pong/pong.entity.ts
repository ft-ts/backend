import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MatchType } from './pong.enum';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class MatchInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.name)
  @JoinColumn({ name: 'home' })
  home: User;

  @Column({ nullable: false })
  home_score: number;

  @ManyToOne(() => User, user => user.name)
  @JoinColumn({ name: 'away' })
  away: User;

  @Column({ nullable: false })
  away_score: number;

  @Column({ nullable: false })
  match_type: MatchType;

  @Column()
  start_date: Date;
}
