import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  Get,
  Post,
  Body,
  Query,
  Patch,
  Param,
  Delete,
  Controller,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { SERVICES } from '@app/shared/constants/services';
import { CONTACT_PATTERNS } from '@app/shared/constants/message-patterns';
import { UserAuth } from '@app/shared/decorators/http.decorators';
import { UserID } from '@app/shared/decorators/get-user-id.decorator';

@ApiTags('Contact')
@Controller('contact')
@UserAuth()
export class ContactController {
  constructor(
    @Inject(SERVICES.CONTACT_SERVICE) private readonly contactClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: '[Contact] Get Contact' })
  async find(@UserID() userId: string, @Query() query: Record<string, any>): Promise<any> {
    return firstValueFrom(
      this.contactClient.send(CONTACT_PATTERNS.FIND, { query, userId }),
    );
  }

  @Post()
  @ApiOperation({ summary: '[Contact] Create Contact' })
  async createContact(@Body() body: Record<string, any>, @UserID() userId: string): Promise<any> {
    return firstValueFrom(
      this.contactClient.send(CONTACT_PATTERNS.CREATE, { body, userId }),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: '[Contact] Update Contact' })
  async updateContact(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
    @UserID() userId: string,
  ): Promise<any> {
    return firstValueFrom(
      this.contactClient.send(CONTACT_PATTERNS.UPDATE, { id, body, userId }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Contact] Delete Contact' })
  async deleteContact(@Param('id') id: string, @UserID() userId: string): Promise<any> {
    return firstValueFrom(
      this.contactClient.send(CONTACT_PATTERNS.DELETE, { id, userId }),
    );
  }
}
