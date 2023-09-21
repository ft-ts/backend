import { Controller, Get, Param, UseGuards, Body, Post } from "@nestjs/common";
import { DmService } from "./dm.service";
import { GetUser } from "src/common/decorators";
import { AtGuard } from "src/auth/auth.guard";
import { User } from 'src/user/entities/user.entity';

@Controller('dm')
@UseGuards(AtGuard)
export class DmController {
  constructor(private readonly dmService: DmService) {}

  @Get('/list')
  async getMyDMList(@GetUser() user: User) {
    const res = await this.dmService.getMyDMList(user.uid);
    return res;
  }

  @Get(':uid')
  async getDMLogBetween(@GetUser() user: User, @Param('uid') uid: number) {
    const res = await this.dmService.getDMLogBetween(user.uid, uid);
    return res;
  }

  @Post('/read')
  async readDmLog(@GetUser() user: User, @Body() body: any) {
    const { targetUid } = body.data;
    const res = await this.dmService.postReadDmLog(user.uid, targetUid);
    return res;
  }
}