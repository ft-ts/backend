import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, Query } from '@nestjs/common';
import { LoginService } from './login.service';
import { User } from 'src/user/entities/user.entity';
import { Request, Response } from 'express';
import { GetUser } from 'src/common/decorators';
import { AuthGuard } from '@nestjs/passport';
import { AtGuard } from 'src/auth/auth.guard';

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
    const { accessToken, redirectUrl } = await this.loginService.validateUser(user);
    if (accessToken) {
      res.cookie('accessToken', accessToken, { sameSite: 'strict' }); // sameSite : 동일한 출처만 허용 (port, protocol, host가 같아야함)
      res.header('Cache-Control', 'no-store');
    }
    const url = `http://${process.env.SERVER_IP}:${process.env.FRONT_PORT}/${redirectUrl}`;
    res.status(302).redirect(url);
  }

  @Get('/logout')
  @UseGuards(AtGuard)
  async logout(@GetUser() user: User, @Req() req: Request) {
    return await this.loginService.logout(user, req.headers.authorization);
  }

  @Get('/2fa')
  @UseGuards(AtGuard)
  async createQRCode(@GetUser() user: User) {
    return await this.loginService.createQRCode(user);
  }

  @Post('/2fa')
  @UseGuards(AtGuard)
  async validate2FA(@GetUser() user: User, @Body() body, @Req() req: Request, @Res() res: Response) {
    const accessToken = await this.loginService.validate2FA(user, body.code, req.headers.authorization);
    if (accessToken) {
      res.cookie('accessToken', accessToken);
      res.header('Cache-Control', 'no-store');
      res.status(200).json({ success: true, message: 'Login Success' });
    }
    else {
      res.status(200).json({ success: false, message: 'Invalid Code' });
    }
  }
}
