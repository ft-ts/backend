import { Resolver, Mutation, Args, Context, Query, Int } from "@nestjs/graphql";
import { GroupChannels } from "./entities/groupChannels.entity";
import { DmChannels } from "./entities/dmChannels.entity";
import { DmChannelService, GroupChannelService } from "./channel.service";
import { CreateGroupChannelDto,  } from "./dto/channel.dto";
import { Users } from "../users/entities/user.entity";

@Resolver(() => GroupChannels)
export class GroupChannelResolver {
  constructor(private readonly channelService: GroupChannelService) {}

  @Mutation(() => GroupChannels)
  async createGroupChannel(
    @Args("createGroupChannelDto") createGroupChannelDto: CreateGroupChannelDto,
    @Context("user") user: Users
  ) {
    return this.channelService.createGroupChannel(createGroupChannelDto, user);
  }

  @Query(() => [GroupChannels])
  async getAllGroupChannels(): Promise<GroupChannels[]> {
    return this.channelService.getAllGroupChannels();
  }

  @Query(() => [GroupChannels])
  async getMyGroupChannels(
    @Context('user') user: Users,
  ): Promise<GroupChannels[]> {
    return this.channelService.getMyGroupChannels(user);
  }

  @Query(() => GroupChannels)
  async getGroupChannelById(@Args('id', { type: () => Int }) id: number): Promise<GroupChannels> {
    return this.channelService.getGroupChannelById(id);
  }

  @Mutation(() => GroupChannels)
  async enterGroupChannel(
    @Args('userId') userId: number,
    @Args('channelId') channelId: number,
    @Args('password', { nullable: true }) password: string,
  ): Promise<GroupChannels> {
    const user = new Users();
    user.id = userId;
    
    return this.channelService.enterGroupChannel(user, channelId, password);
  }

  @Query(() => [Users])
  async getChannelMembers(@Args('channelId', { type: () => Int }) channelId: number): Promise<Users[]> {
    return this.channelService.getChannelMembers(channelId);
  }

}





@Resolver(() => DmChannels)
export class DmChannelResolver {
  constructor(private readonly channelService: DmChannelService) {}

  @Mutation(() => DmChannels)
  async createDmChannel(
    @Args("userA") userA: Users,
    @Args("userB") userB: Users
  ) {
    return this.channelService.createDmChannel(userA, userB);
  }
}