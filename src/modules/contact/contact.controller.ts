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
} from '@nestjs/common';

import { Contact } from './schemas/contact.schema';
import { ContactService } from './contact.service';
import { GetContactDto } from './dto/get-contact.dto';
import { ResPagingDto } from 'src/shares/dtos/pagination.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UserID } from 'src/shares/decorators/get-user-id.decorator';
import { UserAuth } from 'src/shares/decorators/http.decorators';

@ApiTags('Contact')
@Controller('contact')
@UserAuth()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  @ApiOperation({ summary: '[Contact] Get Contact' })
  async find(
    @UserID() userId: string,
    @Query() query: GetContactDto,
  ): Promise<ResPagingDto<Contact[]>> {
    return this.contactService.find(query, userId);
  }

  @Post()
  @ApiOperation({
    summary: '[Contact] Create Contact',
  })
  async createContact(
    @Body() body: CreateContactDto,
    @UserID() userId: string,
  ): Promise<void> {
    await this.contactService.create(body, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '[Contact] Update Contact',
  })
  async updateContact(
    @Param('id') id: string,
    @Body() body: CreateContactDto,
    @UserID() userId: string,
  ): Promise<void> {
    await this.contactService.update(body, id, userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '[Contact] Delete Contact',
  })
  async deleteContact(
    @Param('id') id: string,
    @UserID() userId: string,
  ): Promise<void> {
    await this.contactService.delete(id, userId);
  }
}
