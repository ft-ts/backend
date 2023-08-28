import { Socket } from 'socket.io';
import { Ball } from '../game/entities/ball.entity';
import { Paddle } from '../game/entities/paddle.entity';
import { MatchType } from '../enum/matchType.enum';

export interface MatchInfoDto {
  matchType: MatchType;
  user1: Socket;
  user2: Socket;
  user1_score: number;
  user2_score: number;
  user1_elo: number;
  user2_elo: number;
  winner_id: number;
  loser_id: number;
  start_date: Date;
  interval: NodeJS.Timeout;
}

export interface GameInfo {
  player1: Paddle;
  player2: Paddle;
  ball: Ball;
}

export interface UpdateMatchInfoDto {
  winner_id: string;
  loser_id: string;
  winner_score: number;
  loser_score: number;
  match_type: MatchType;
  timestamp: Date;
}