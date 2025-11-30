import { Controller, Post, Body } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  async handleWebhook(@Body() payload: Record<string, unknown>) {
    await this.webhooksService.handlePostHogEvent(payload);
    return { success: true };
  }
}

