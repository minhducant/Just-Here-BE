import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Delete, Query, Param } from '@nestjs/common';

import { User } from './schemas/user.schema';
import { UserService } from './user.service';
import { IdDto } from 'src/shares/dtos/param.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { ResPagingDto } from 'src/shares/dtos/pagination.dto';
import { UserAuth } from 'src/shares/decorators/http.decorators';
import { UserID } from 'src/shares/decorators/get-user-id.decorator';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '[User] Get all user' })
  async findAll(
    @Query() query: GetUsersDto,
    @UserID() userId: string,
  ): Promise<ResPagingDto<User[]>> {
    return this.userService.findAll(query, userId);
  }

  @Get('me')
  @ApiBearerAuth()
  @UserAuth()
  @ApiOperation({ summary: '[User] Get my profile' })
  async currentUser(@UserID() userId: string): Promise<User> {
    return this.userService.findById(userId);
  }

  @Get('/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[User] Get all user' })
  async findAllAdmin(
    @Query() query: GetUsersDto,
    @UserID() userId: string,
  ): Promise<ResPagingDto<User[]>> {
    return this.userService.findAllAdmin(query, userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UserAuth()
  @ApiOperation({
    summary: '[User] Get user by id',
  })
  async findOne(@Param() { id }: IdDto): Promise<User> {
    return this.userService.findById(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UserAuth()
  @ApiOperation({
    summary: '[User] Delete user by id',
  })
  async delete(@Param() { id }: IdDto): Promise<void> {
    return this.userService.delete(id);
  }
}
