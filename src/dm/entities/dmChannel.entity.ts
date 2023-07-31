import { Entity, OneToMany, JoinColumn, Index, ManyToOne, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Dm } from './dm.entity';
import { DmUser } from './dmUser.entity';

@Entity({ name: 'dm' })
@Index(['userA', 'userB'], { unique: true })
export class DmChannel {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Dm, (message) => message.channel, {
    cascade: ['insert', 'remove', 'update'],
  })
  chatMessage: Dm[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: number;
  
  @OneToMany(() => DmUser, (dmChannelUser) => dmChannelUser.channel)
  @JoinColumn()
  dmChannelUser: DmUser[];

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userA' })
  userA: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userB' })
  userB: User;
}
