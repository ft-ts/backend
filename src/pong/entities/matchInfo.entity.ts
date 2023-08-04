import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { MatchType } from '../enum/matchType.enum';

@Entity()
export class MatchInfoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  match_id: string;

  @Column({ nullable: false })
  user1_id: number;

  @Column({ nullable: false })
  user2_id: number;

  @Column({ default: 'ladder', nullable: false })
  match_type: MatchType;

  @Column({ default: 0 })
  user1_score: number;

  @Column({ default: 0 })
  user2_score: number;

  @Column({ nullable: false })
  winner_id: number;

  @Column({ nullable: false })
  loser_id: number;

  @Column()
  timestamp: Date;
}
