import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MatchInfo } from "./entities/matchInfo.entity";
import { UpdateMatchInfoDto } from "./dto/pong.dto";
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
      match_id: matchInfo.match_id,
      user1_id: matchInfo.user1_id,
      user2_id: matchInfo.user2_id,
      match_type: matchInfo.match_type,
      user1_score: matchInfo.user1_score,
      user2_score: matchInfo.user2_score,
      winner_id: matchInfo.winner_id,
      loser_id: matchInfo.loser_id,
      timestamp: matchInfo.timestamp,
    });
    try {
      await this.matchInfoRepository.save(newMatchInfo);
    } catch (err) {
      console.log(err);
    }
  }

  async updateUsersElo(
    uid: number,
    elo: number,
  ){
    const user = await this.userRepository.findOne({
      where: {
        uid: uid,
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
    uid: number,
  ){
    const result = await this.matchInfoRepository
    .createQueryBuilder('matchInfo')
    .select(['matchInfo.id', 'matchInfo.match_id', 'matchInfo.match_type', 'matchInfo.user1_score', 'matchInfo.user2_score', 'matchInfo.winner_id', 'matchInfo.loser_id', 'matchInfo.timestamp'])
    .where('user1_id = :uid', { uid : uid })
    .orWhere('user2_id = :uid', { uid : uid })
    .orderBy('matchInfo.timestamp', 'DESC')
    .getMany();
    return result;
  }
}
