import { Socket } from 'socket.io';
import { Ball } from '../game/entities/ball.entity';
import { Paddle } from '../game/entities/paddle.entity';

export interface MatchInfo {
  matchID: string;
  matchType: string;
  user1: Socket;
  user2: Socket;
  user1_score: number;
  user2_score: number;
  user1_elo: number;
  user2_elo: number;
  winner_id: string;
  start_date: Date;
  interval: NodeJS.Timeout;
}

export interface GameInfo {
  player1: Paddle;
  player2: Paddle;
  ball: Ball;
}