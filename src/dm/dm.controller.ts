import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { DmService } from "./dm.service";
import { GetUser } from "src/common/decorators";
import { AtGuard } from "src/auth/auth.guard";

@Controller('dm')
@UseGuards(AtGuard)
export class DmController {
  constructor(private readonly dmService: DmService) {}

  @Get()
  getAllDmLog(@GetUser() user: any) {
    return this.dmService.getAllMyDmLog(user.uid);
  }

  @Get('/with/:targetName')
  getDMLogBetween(@GetUser() user: any, @Param('targetName') targetName: string) {
    return this.dmService.getDMLogBetween(user.uid, targetName);
  }
}