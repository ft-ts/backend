import { Socket } from 'socket.io';
import { GameInfo, MatchInfo,MatchResult } from './game.interface';
import { Paddle } from './entities/paddle.entity';
import { Ball } from './entities/ball.entity';
import { MatchType } from '../pong.enum';
import { User } from 'src/user/entities/user.entity';

export async function calculateEloPoint(
  myPoint : number,
  opponentPoint : number,
  isWin : boolean,
) : Promise<number>{
  const K: number = 10;
  const W: number = isWin ? 1 : -1;
  const We: number = 1 / (1 + Math.pow(10, (opponentPoint - myPoint) / 400));
  const newPoint: number = Math.floor(myPoint + K * (W - We));
  return (newPoint);
}

export async function setMatchInfo(
  client1: Socket,
  client2: Socket,
  matchType: MatchType,
  client1Elo: number,
  client2Elo: number,
) : Promise<MatchInfo>{
  const gameInfo : GameInfo = await setGameInfo(client1, client2);
  const MatchID : string = Math.random().toString(36).slice(2);
  const matchInfo: MatchInfo = {
    match_type: matchType,
    match_id: MatchID,
    home: client1,
    away: client2,
    home_elo: client1Elo,
    away_elo: client2Elo,
    start_date: new Date(),
    interval: null,
    gameInfo: gameInfo,
  }
  return (matchInfo);
}

export async function setGameInfo(
  client1: Socket,
  client2: Socket,
) : Promise<GameInfo>{
  const player1: Paddle = new Paddle(true, client1.data.uid);
  const player2: Paddle = new Paddle(false, client2.data.uid);
  const ball: Ball = new Ball(player1, player2);
  const gameInfo: GameInfo = {
    home_paddle: player1,
    away_paddle: player2,
    ball: ball,
    is_finish: false,
  }
  return (gameInfo);
}

export async function setMatchResult(
  matchInfo: MatchInfo,
  home: User,
  away: User,
) : Promise<MatchResult>{
  const matchResult: MatchResult = {
    home: home,
    away: away,
    home_score: matchInfo.gameInfo.home_paddle.getScore(),
    away_score: matchInfo.gameInfo.away_paddle.getScore(),
    match_type: matchInfo.match_type,
    start_date: matchInfo.start_date,
  }
  return (matchResult);
}

