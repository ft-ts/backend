import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MatchInfo } from "./pong.entity";
import { Injectable, Logger } from "@nestjs/common";
import { User } from "src/user/entities/user.entity";
import { UserStatus } from "src/user/enums/userStatus.enum";
import { MatchType } from "./pong.enum";
import { MatchResult } from "./game/game.interface";
import { calculateEloPoint } from "./game/game.utils";

@Injectable()
export class PongRepository{
  constructor(
    @InjectRepository(MatchInfo)
    private matchInfoRepository: Repository<MatchInfo>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ){ }

  async saveMatchInfo(
    matchResult : MatchResult,
  ) {
    const newMatchInfo = this.matchInfoRepository.create({
      home : matchResult.home,
      home_score : matchResult.home_score,
      away : matchResult.away,
      away_score : matchResult.away_score,
      match_type : matchResult.match_type,
      start_date : matchResult.start_date,
    });
    try {
      await this.matchInfoRepository.save(newMatchInfo);
    } catch (err) {
      Logger.error(err);
    }
  }

  async getUserEntity(
    uid: number,
  ){
    const user : User = await this.userRepository.findOne({
      where: {
        uid: uid,
      }
    });
    return (user);
  }

  async getUserElo(
    uid: number
  ){
    const elo : number = await this.userRepository
    .createQueryBuilder('users')
    .select('users.rating')
    .where('users.uid = :uid', { uid : uid })
    .getOne()
    .then((user) => {
      if (user === undefined || user === null) return null;
      return user.rating;
    })
    .catch((err) => {
      Logger.error(err);
      return null;
    });
    return (elo);
  }

  async updateUserEntity(
    user: User,
    myElo: number,
    opponentElo: number,
    isWin: boolean,
    matchType: MatchType,
  ){
    if (user === undefined || user === null) return (false);
    if (matchType === MatchType.LADDER){
      if (isWin === true) {
        user.ladder_wins += 1;
        user.rating = await calculateEloPoint(myElo, opponentElo, true);
      }
      else {
        user.ladder_losses += 1;
        user.rating = await calculateEloPoint(myElo, opponentElo, false);
      }
    } else {
      if (isWin === true) user.custom_wins += 1;
      else user.custom_losses += 1;
    }
    await this.userRepository.save(user);
  }

  async getUserMatchHistory(
    name: string,
  ): Promise<any | null>{
    const user: User = await this.getUserByName(name);
    if (user === null) return null;
    const result = await this.matchInfoRepository
    .createQueryBuilder('matchInfo')
    .select(['matchInfo.id AS id', 'home.name AS home', 'away.name AS away', 'matchInfo.home_score AS home_score', 'matchInfo.away_score AS away_score', 'matchInfo.match_type AS match_type', 'matchInfo.start_date AS start_date'])
    .leftJoin('matchInfo.home', 'home')
    .leftJoin('matchInfo.away', 'away')
    .where('home.name = :userName', { userName: user.name })
    .orWhere('away.name = :userName', { userName: user.name })
    .orderBy('matchInfo.start_date', 'DESC')
    .getRawMany()
    .then((result) => {
      if (result === undefined || result === null) return null;
      return result;
    }).catch((err) => {
      Logger.error('getUserMatchHistory',err);
      return null;
    });
    return result;
  }

  async getUserByName(
    name: string,
  ) : Promise<User | null>{
    const user: User = await this.userRepository
    .createQueryBuilder('users')
    .select(['users.uid', 'users.name', 'users.rating', 'users.ladder_wins', 'users.ladder_losses', 'users.custom_wins', 'users.custom_losses'])
    .where('users.name = :name', { name : name })
    .getOne()
    .then((user) => {
      if (user === undefined || user === null) return null;
      return user;
    }).catch((err) => {
      Logger.error(err);
      return null;
    });
    return user;
  }

  async getUserStatus(
    uid: number,
  ){
    const status: string = await this.userRepository
    .createQueryBuilder('users')
    .select('users.status')
    .where('users.uid = :uid', { uid : uid })
    .getOne()
    .then((user) => {
      if (user === undefined || user === null) return null;
      return user.status;
    })
    .catch((err) => {
      Logger.error(err);
      return null;
    });
    return (status);
  }

  async updateUserStatus(
    user: User,
    status: UserStatus,
  ){
    if (user === undefined || user === null) return (false);
    user.status = status;
    await this.userRepository.save(user).then(() => {
      return (true);
    }).catch((err) => {
      Logger.error(err);
      return (false);
    });
  }
}
