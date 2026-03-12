import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CONTACT_PATTERNS } from '@app/shared/constants/message-patterns';
import { ContactService } from './contact.service';

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @MessagePattern(CONTACT_PATTERNS.FIND)
  async find(@Payload() data: { query: any; userId: string }): Promise<any> {
    return this.contactService.find(data.query, data.userId);
  }

  @MessagePattern(CONTACT_PATTERNS.CREATE)
  async create(@Payload() data: { body: any; userId: string }): Promise<void> {
    return this.contactService.create(data.body, data.userId);
  }

  @MessagePattern(CONTACT_PATTERNS.UPDATE)
  async update(@Payload() data: { id: string; body: any; userId: string }): Promise<void> {
    return this.contactService.update(data.body, data.id, data.userId);
  }

  @MessagePattern(CONTACT_PATTERNS.DELETE)
  async delete(@Payload() data: { id: string; userId: string }): Promise<void> {
    return this.contactService.delete(data.id, data.userId);
  }
}
