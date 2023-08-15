import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { DmService } from "./dm.service";
import { GetUser } from "src/common/decorators";
import { AtGuard } from "src/auth/auth.guard";

@Controller('dm')
@UseGuards(AtGuard)
export class DmController {
  constructor(private readonly dmService: DmService) {}

  @Get('/list')
  getMyDMList(@GetUser() user: any) {
    return this.dmService.getMyDMList(user.uid);
  }

  @Get('/all')
  getAllDmLog(@GetUser() user: any) {
    return this.dmService.getAllDmLog(user.uid);
  }

  @Get('/:uid')
  getDMLogBetween(@GetUser() user: any, @Param('uid') targetUid: number) {
    return this.dmService.getDMLogBetween(user.uid, targetUid);
  }
}