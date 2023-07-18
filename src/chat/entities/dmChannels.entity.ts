import { Entity, OneToMany, JoinColumn, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Channels } from "./channels.entity";
import { DmChannelUser } from "./dmChannelUser.entity";
import { Users } from "../../users/entities/user.entity";

@Entity()
@Index(["userA", "userB"], { unique: true })
export class DmChannels extends Channels {
  @OneToMany(() => DmChannelUser, (dmChannelUser) => dmChannelUser.channel)
  @JoinColumn()
  dmChannelUser: DmChannelUser[];

  @ManyToOne(() => Users, { eager: true })
  @JoinColumn({ name: "userA" })
  userA: Users;

  @ManyToOne(() => Users, { eager: true })
  @JoinColumn({ name: "userB" })
  userB: Users;
}
