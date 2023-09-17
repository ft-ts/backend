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
  constructor(private readonly loginService: LoginService) { }

  @Get('/')
  @UseGuards(AuthGuard('42'))
  login() {
    return;
  }

  @Get('/redirect')
  @UseGuards(AuthGuard('42'))
  async redirect(@GetUser() user: User, @Res() res: Response) {
    const { tokens, redirectUrl } = await this.loginService.validateUser(user);
    res.cookie('accessToken', tokens.accessToken, { sameSite: 'strict' }); // sameSite : 동일한 출처만 허용 (port, protocol, host가 같아야함)
    res.cookie('refreshToken', tokens.refreshToken, { sameSite: 'strict' });
    res.header('Cache-Control', 'no-store');
    res.status(302).redirect(`http://${process.env.SERVER_IP}:${process.env.FRONT_PORT}/${redirectUrl}`);
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
    res.cookie('accessToken', accessToken);
    res.cookie('refreshToken', refreshToken);
    res.header('Cache-Control', 'no-store');

    res.status(200).redirect(`http://${process.env.SERVER_IP}:${process.env.FRONT_PORT}/main`);
  }

  @Get('/2fa')
  @UseGuards(AtGuard)
  async createQRCode(@GetUser() user: User) {
    return await this.loginService.createQRCode(user);
  }

  @Post('/2fa')
  @UseGuards(AtGuard)
  async validate2FA(@GetUser() user: User, @Body() body, @Res() res: Response) {
    const tokens = await this.loginService.validate2FA(user, body.code);
    if (tokens) {
      res.cookie('accessToken', tokens.accessToken);
      res.cookie('refreshToken', tokens.refreshToken);
      res.header('Cache-Control', 'no-store');
      res.status(200).json({ success: true, message: 'Login Success' });
    }
    else {
      res.status(200).json({ success: false, message: 'Invalid Code' });
    }
  }

  @Post('/addDemoUser')
  async loginByDemoUser(@Res() res: Response, @Body() user: User) {
    const { accessToken, refreshToken } = await this.loginService.loginByDemoUser(user);
    res.setHeader('access_token', `Bearer ${accessToken}`);
    res.setHeader('refresh_token', `Bearer ${refreshToken}`);
    res.json({ accessToken, refreshToken });
  }
}
