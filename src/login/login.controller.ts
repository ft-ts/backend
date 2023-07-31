import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, Query } from '@nestjs/common';
import { LoginService } from './login.service';
import { User } from 'src/user/entities/user.entity';
import { Response } from 'express';
import { GetUser } from 'src/common/decorators';
import { AuthGuard } from '@nestjs/passport';
import { AtGuard } from 'src/auth/auth.guard';
import { RtGuard } from 'src/auth/rt.guard';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Get('/')
  @UseGuards(AuthGuard('42'))
  login() {
    return ;
  }

  @Get('/redirect')
  @UseGuards(AuthGuard('42'))
  async redirect(@GetUser() user: User, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.loginService.validateUser(user);
    res.setHeader('access_token', `Bearer ${accessToken}`);
    res.setHeader('refresh_token', `Bearer ${refreshToken}`);
    res.json({ accessToken, refreshToken });
  }

  @Get('/logout')
  @UseGuards(AtGuard)
  async logout(@GetUser() user: User) {
    return await this.loginService.logout(user);
  }

  @Get('/refresh')
  @UseGuards(RtGuard)
  async refreshToken(@GetUser() user: User, @Res() res) {
    const { accessToken, refreshToken } = await this.loginService.refreshTokens(
      user,
    );
    res.setHeader('access_token', `Bearer ${accessToken}`);
    res.setHeader('refresh_token', `Bearer ${refreshToken}`);
    res.json({ accessToken, refreshToken });
  }

  @Get('/2fa')
  @UseGuards(AtGuard)
  async createQRCode(@GetUser() user: User) {
    return await this.loginService.createQRCode(user);
  }

  @Post('/2fa')
  @UseGuards(AtGuard)
  async validate2FA(@GetUser() user: User, @Body() body) {
    return await this.loginService.validate2FA(user, body.code);
  }

  @Post('/addDemoUser')
  async loginByDemoUser(@Res() res: Response, @Body() user: User) {
    const { accessToken, refreshToken } = await this.loginService.loginByDemoUser(user);
    res.setHeader('access_token', `Bearer ${accessToken}`);
    res.setHeader('refresh_token', `Bearer ${refreshToken}`);
    res.json({ accessToken, refreshToken });
  }
}
