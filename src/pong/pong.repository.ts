import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MatchInfo } from "./pong.entity";
import { UpdateMatchInfoDto } from "./pong.dto";
import { Injectable } from "@nestjs/common";
import { User } from "src/user/entities/user.entity";

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
      console.log(err);
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
    console.log(user_id);

    // const result = await this.matchInfoRepository
    // .createQueryBuilder('matchInfo')
    // .select(['matchInfo.id', 'matchInfo.match_id', 'matchInfo.match_type', 'matchInfo.user1_score', 'matchInfo.user2_score', 'matchInfo.winner_id', 'matchInfo.loser_id', 'matchInfo.timestamp'])
    // .where('user1_id = :uid', { uid : uid })
    // .orWhere('user2_id = :uid', { uid : uid })
    // .orderBy('matchInfo.timestamp', 'DESC')
    // .getRawMany();

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
      console.log(err);
      return null;
    });
    console.log(uid);
    
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
      console.log(err);
      return null;
    });
    console.log(name);
    return (name);
  }
}
