import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageDto } from './create-message.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {
  @IsNotEmpty()
  id: number;
}