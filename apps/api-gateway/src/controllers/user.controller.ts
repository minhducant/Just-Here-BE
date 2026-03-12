import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Delete, Query, Param, Patch, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { SERVICES } from '@app/shared/constants/services';
import { USER_PATTERNS } from '@app/shared/constants/message-patterns';
import { UserAuth } from '@app/shared/decorators/http.decorators';
import { UserID } from '@app/shared/decorators/get-user-id.decorator';
import { IdDto } from '@app/shared/dtos/param.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    @Inject(SERVICES.USER_SERVICE) private readonly userClient: ClientProxy,
  ) {}

  @Get()
  @UserAuth()
  @ApiOperation({ summary: '[User] Get all user' })
  async findAll(@Query() query: Record<string, any>, @UserID() userId: string): Promise<any> {
    return firstValueFrom(
      this.userClient.send(USER_PATTERNS.FIND_ALL, { query, userId }),
    );
  }

  @Get('me')
  @UserAuth()
  @ApiOperation({ summary: '[User] Get my profile' })
  async currentUser(@UserID() userId: string): Promise<any> {
    return firstValueFrom(
      this.userClient.send(USER_PATTERNS.FIND_BY_ID, { id: userId }),
    );
  }

  @Get(':id')
  @UserAuth()
  @ApiOperation({ summary: '[User] Get user by id' })
  async findOne(@Param() { id }: IdDto): Promise<any> {
    return firstValueFrom(
      this.userClient.send(USER_PATTERNS.FIND_BY_ID, { id }),
    );
  }

  @Delete(':id')
  @UserAuth()
  @ApiOperation({ summary: '[User] Delete user by id' })
  async delete(@Param() { id }: IdDto): Promise<any> {
    return firstValueFrom(
      this.userClient.send(USER_PATTERNS.DELETE, { id }),
    );
  }

  @Patch(':id')
  @UserAuth()
  @ApiOperation({ summary: '[User] Update user by id' })
  async update(@Param() { id }: IdDto, @Body() updateData: Record<string, any>): Promise<any> {
    return firstValueFrom(
      this.userClient.send(USER_PATTERNS.UPDATE, { id, updateData }),
    );
  }
}
