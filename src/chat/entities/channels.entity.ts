import { CreateDateColumn, Entity, BaseEntity, Index, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatMessage } from './chatMessage.entity';

@Entity()
export abstract class Channels extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => ChatMessage, (message) => message.channel, {
    cascade: ['insert', 'remove', 'update'],
  })
  chatMessage: ChatMessage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: number;
}