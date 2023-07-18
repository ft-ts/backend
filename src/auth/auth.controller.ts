import { Controller, Get, UseGuards, Res, Req, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getAuth() {
    Logger.log('# GET /auth');
    return '<a href="auth/login">42로그인</a>';
  }

  @Get('/login')
  @UseGuards(AuthGuard('42'))
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  oAuth42() {}

  @Get('/redirect')
  @UseGuards(AuthGuard('42'))
  async login(@Res() res, @Req() req) {
    const { accessToken } = await this.authService.validateUser(req.user);
    res.setHeader('Authorization', `Bearer ${accessToken}`);
    res.json({ accessToken });
  }

  @Get('/logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Res() res, @Req() req) {
    Logger.log('# GET /auth/logout');
  }
}
