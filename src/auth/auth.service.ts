import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(userDto): Promise<{ accessToken: string }> {
    Logger.log('# AuthService validateUser');

    try {
      const oldUser: User = await this.authRepository.findOneBy({
        id: userDto.id,
      });

      if (oldUser) {
        const accessToken: string = this.jwtService.sign({
          intraId: userDto.intraId,
          email: userDto.email,
        });
        return { accessToken };
      }

      Logger.log('# User Not Found! Creating New User...');

      const newUser: User = this.authRepository.create({
        intraId: userDto.intraId,
        name: userDto.name,
        email: userDto.email,
        avatar: userDto.avatar,
      });
      this.authRepository.save(newUser);
      const accessToken = this.jwtService.sign({
        intraId: newUser.intraId,
        email: newUser.email,
      });
      return { accessToken };
    } catch (error) {
      Logger.log('# AuthService validateUser Error');
      throw new InternalServerErrorException('Something went wrong :(');
    }
  }
}
