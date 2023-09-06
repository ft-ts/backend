import { Socket } from 'socket.io';
import { Ball } from 'src/pong/game/entities/ball.entity';
import { Paddle } from 'src/pong/game/entities/paddle.entity';
import { MatchType } from 'src/pong/pong.enum';
import { User } from 'src/user/entities/user.entity';

export interface MatchInfo {
  match_type: MatchType;
  match_id: string;
  home: Socket;
  away: Socket;
  home_elo: number;
  away_elo: number;
  start_date: Date;
  interval: NodeJS.Timeout;
  gameInfo: GameInfo;
}

export interface GameInfo {
  home_paddle: Paddle;
  away_paddle: Paddle;
  ball: Ball;
  is_finish: boolean;
}

export interface MatchResult {
  home: User;
  away: User;
  home_score: number;
  away_score: number;
  match_type: MatchType;
  start_date: Date;
}


export interface ReadyStatus {
  home: boolean;
  away: boolean;
}