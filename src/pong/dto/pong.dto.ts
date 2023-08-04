import { Socket } from 'socket.io';
import { Ball } from '../game/entities/ball.entity';
import { Paddle } from '../game/entities/paddle.entity';
import { MatchType } from '../enum/matchType.enum';

export interface MatchInfoDto {
  matchID: string;
  matchType: MatchType;
  user1: Socket;
  user2: Socket;
  user1_score: number;
  user2_score: number;
  user1_elo: number;
  user2_elo: number;
  winner_id: number;
  start_date: Date;
  interval: NodeJS.Timeout;
}

export interface GameInfo {
  player1: Paddle;
  player2: Paddle;
  ball: Ball;
}

export interface updateDto {
  user1_id: number;
  user2_id: number;
  match_type: string;
  user1_score: number;
  user2_score: number;
  user1_elo: number;
  user2_elo: number;
  winner_id: number;
  timestamp: Date;
}