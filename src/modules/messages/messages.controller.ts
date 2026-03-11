import {
  Get,
  Put,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UsePipes,
  Controller,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@ApiTags('Messages')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({ summary: '[Messages] Create a new message' })
  @ApiCreatedResponse({
    description: '[Messages] Message created successfully',
  })
  @ApiBadRequestResponse({ description: '[Messages] Invalid request data' })
  @Post()
  async create(@Body() body: CreateMessageDto) {
    return this.messagesService.create(body);
  }

  @ApiOperation({ summary: '[Messages] Get paginated message list' })
  @ApiOkResponse({ description: '[Messages] Paginated message list returned' })
  @Get()
  async findPaginated(@Query() query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    return this.messagesService.findPaginated({ page, limit });
  }

  @ApiOperation({
    summary: '[Messages] Get all message',
  })
  @ApiOkResponse({ description: '[Messages] Full message list returned' })
  @Get('all')
  async findAll() {
    return this.messagesService.findAll();
  }

  @ApiOperation({ summary: '[Messages] Get message by ID' })
  @ApiOkResponse({ description: '[Messages] Message returned' })
  @ApiNotFoundResponse({ description: '[Messages] Message not found' })
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.messagesService.findById(id);
  }

  @ApiOperation({ summary: '[Messages] Delete message by ID' })
  @ApiOkResponse({ description: '[Messages] Message deleted successfully' })
  @ApiNotFoundResponse({ description: '[Messages] Message not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }

  @ApiOperation({ summary: '[Messages] Update message by ID' })
  @ApiOkResponse({ description: '[Messages] Message updated successfully' })
  @ApiNotFoundResponse({ description: '[Messages] Message not found' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateMessageDto) {
    return this.messagesService.update(id, body as any);
  }
}
