import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
} from 'typeorm';

export enum TokenStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
};

@Entity({ name: 'token' })
export class Token extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  accessToken: string;

  @Column({ default: TokenStatus.ACTIVE })
  status: TokenStatus;
}
