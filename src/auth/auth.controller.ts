import { Controller, Get, UseGuards, Res, Req, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/decorators';
import { AtGuard, RtGuard } from 'src/common/guards';
import { User } from 'src/user/entities/user.entity';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/login')
  @UseGuards(AuthGuard('42'))
  login() {
    //
  }

  @Get('/redirect')
  @UseGuards(AuthGuard('42'))
  async redirect(@Res() res, @Req() req) {
    const { accessToken, refreshToken } = await this.authService.validateUser(
      req.user,
    );
    res.setHeader('access_token', `Bearer ${accessToken}`);
    res.setHeader('refresh_token', `Bearer ${refreshToken}`);
    res.json({ accessToken, refreshToken });
  }

  @Get('/logout')
  @UseGuards(AtGuard)
  async logout(@GetUser() user: User) {
    return await this.authService.logout(user);
  }

  @Get('/refresh')
  @UseGuards(RtGuard)
  async refreshToken(@GetUser() user: User, @Res() res) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      user,
    );
    res.setHeader('access_token', `Bearer ${accessToken}`);
    res.setHeader('refresh_token', `Bearer ${refreshToken}`);
    res.json({ accessToken, refreshToken });
  }

  @Get('/2fa')
  @UseGuards(AtGuard)
  async createTwoFactorAuth(@GetUser() user: User) {
    return await this.authService.createTwoFactorAuth(user);
  }

  @Post('/2fa')
  @UseGuards(AtGuard)
  async verifyTwoFactorAuth(@GetUser() user: User, @Body() body) {
    return await this.authService.verifyTwoFactorAuth(user, body);
  }
}
