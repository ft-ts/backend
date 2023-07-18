import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Channels } from '../../chat/entities/channels.entity';
import { DmChannelUser } from '../../chat/entities/dmChannelUser.entity';
import { GroupChannelUser } from '../../chat/entities/groupChannelUser.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  intra_id: number;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  avatar: string;

  // by sielee
  @OneToMany(() => DmChannelUser, (channel) => channel.user)
  myDmChannels: DmChannelUser[];

  @OneToMany(() => GroupChannelUser, (channel) => channel.user)
  myGroupChannels: GroupChannelUser[];

}
