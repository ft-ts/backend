import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { MatchType } from './pong.enum';

@Entity()
export class MatchInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  winner_id: string;

  @Column({ nullable: false })
  winner_score: number;

  @Column({ nullable: false })
  loser_id: string;

  @Column({ nullable: false })
  loser_score: number;

  @Column({ nullable: false })
  match_type: MatchType;

  @Column()
  timestamp: Date;
}
