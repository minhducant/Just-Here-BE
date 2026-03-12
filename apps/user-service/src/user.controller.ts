import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { USER_PATTERNS } from '@app/shared/constants/message-patterns';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(USER_PATTERNS.FIND_ALL)
  async findAll(@Payload() data: { query: any; userId: string }): Promise<any> {
    return this.userService.findAll(data.query, data.userId);
  }

  @MessagePattern(USER_PATTERNS.FIND_BY_ID)
  async findById(@Payload() data: { id: string }): Promise<any> {
    return this.userService.findById(data.id);
  }

  @MessagePattern(USER_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { condition: any }): Promise<any> {
    return this.userService.findOne(data.condition);
  }

  @MessagePattern(USER_PATTERNS.UPDATE)
  async update(@Payload() data: { id: string; updateData: any }): Promise<any> {
    return this.userService.update(data.id, data.updateData);
  }

  @MessagePattern(USER_PATTERNS.DELETE)
  async delete(@Payload() data: { id: string }): Promise<void> {
    return this.userService.delete(data.id);
  }

  @MessagePattern(USER_PATTERNS.FIND_OR_CREATE_GOOGLE)
  async findOrCreateGoogle(@Payload() profile: any): Promise<any> {
    return this.userService.findOrCreateGoogleUser(profile);
  }

  @MessagePattern(USER_PATTERNS.FIND_OR_CREATE_FACEBOOK)
  async findOrCreateFacebook(@Payload() profile: any): Promise<any> {
    return this.userService.findOrCreateFacebookUser(profile);
  }

  @MessagePattern(USER_PATTERNS.FIND_OR_CREATE_ZALO)
  async findOrCreateZalo(@Payload() profile: any): Promise<any> {
    return this.userService.findOrCreateZaloUser(profile);
  }

  @MessagePattern(USER_PATTERNS.FIND_OR_CREATE_APPLE)
  async findOrCreateApple(@Payload() profile: any): Promise<any> {
    return this.userService.findOrCreateAppleUser(profile);
  }

  @MessagePattern(USER_PATTERNS.FIND_OR_CREATE_LINE)
  async findOrCreateLine(@Payload() profile: any): Promise<any> {
    return this.userService.findOrCreateLINEUser(profile);
  }
}
