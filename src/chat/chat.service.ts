import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ChatMessage } from './entities/chatMessage.entity';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async create(createChatDto: CreateChatMessageDto): Promise<ChatMessage> {
    const chatMessage = new ChatMessage();
    chatMessage.content = createChatDto.content;

    return this.chatMessageRepository.save(chatMessage);
  }

  async findAll(): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find();
  }

  async findOne(id: number): Promise<ChatMessage> {
    return this.chatMessageRepository.findOne({ where: { id } });
  }

  async update(id: number, updateChatDto: UpdateChatDto): Promise<ChatMessage> {
    const chatMessage = await this.chatMessageRepository.findOne({
      where: { id },
    });
    if (!chatMessage) {
      throw new NotFoundException('Chat message not found');
    }

    chatMessage.content = updateChatDto.content;

    return this.chatMessageRepository.save(chatMessage);
  }

  async remove(id: number): Promise<void> {
    const chatMessage = await this.chatMessageRepository.findOne({
      where: { id },
    });
    if (!chatMessage) {
      throw new NotFoundException('Chat message not found');
    }

    await this.chatMessageRepository.remove(chatMessage);
  }
}
