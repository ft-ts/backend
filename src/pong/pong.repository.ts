import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MatchInfo } from "./pong.entity";
import { UpdateMatchInfoDto } from "./pong.dto";
import { Injectable, Logger } from "@nestjs/common";
import { User } from "src/user/entities/user.entity";
import { UserStatus } from "src/user/enums/userStatus.enum";

@Injectable()
export class PongRepository{
  constructor(
    @InjectRepository(MatchInfo)
    private matchInfoRepository: Repository<MatchInfo>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ){ }

  async saveMatchInfo(
    matchInfo: UpdateMatchInfoDto,
  ) {
    const newMatchInfo = this.matchInfoRepository.create({
      winner_id: matchInfo.winner_id,
      loser_id: matchInfo.loser_id,
      winner_score: matchInfo.winner_score,
      loser_score: matchInfo.loser_score,
      match_type: matchInfo.match_type,
      timestamp: matchInfo.timestamp,
    });
    try {
      await this.matchInfoRepository.save(newMatchInfo);
    } catch (err) {
      Logger.error(err);
    }
  }

  async updateUsersElo(
    user_id: string,
    elo: number,
  ){
    const user = await this.userRepository.findOne({
      where: {
        name: user_id,
      }
    });
    user.rating = elo;
    await this.userRepository.save(user);
  }

  async getAllMatchHistory(
  ){
    console.log('test');
  }

  async getUserMatchHistory(
    user_id: string,
  ){
    const result = await this.matchInfoRepository
    .createQueryBuilder('matchInfo')
    .select(['matchInfo.id', 'matchInfo.match_type', 'matchInfo.winner_score', 'matchInfo.loser_score', 'matchInfo.winner_id', 'matchInfo.loser_id', 'matchInfo.timestamp'])
    .where('winner_id = :user_id', { user_id : user_id })
    .orWhere('loser_id = :user_id', { user_id : user_id })
    .orderBy('matchInfo.timestamp', 'DESC')
    .getRawMany();
    return result;
  }

  private async getUserUIDByName(
    name: string,
  ){
    const uid: number = await this.userRepository
    .createQueryBuilder('users')
    .select('users.uid')
    .where('users.name = :name', { name : name })
    .getOne()
    .then((user) => {
      if (user === undefined || user === null) return null;
      return user.uid;
    })
    .catch((err) => {
      Logger.error(err);
      return null;
    });
    
    return uid;
  }

  async getUserNameByUID(
    uid: number,
  ){
    const name: string = await this.userRepository
    .createQueryBuilder('users')
    .select('users.name')
    .where('users.uid = :uid', { uid : uid })
    .getOne()
    .then((user) => {
      if (user === undefined || user === null) return null;
      return user.name;
    })
    .catch((err) => {
      Logger.error(err);
      return null;
    });
    return (name);
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

  async setUserStatus(
    uid: number,
    status: UserStatus,
  ){
    const user = await this.userRepository.findOne({
      where: {
        uid: uid,
      }
    });
    if (user === undefined || user === null) return (false);
    user.status = status;
    await this.userRepository.save(user);
  }
}
