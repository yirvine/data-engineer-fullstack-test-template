import { Controller, Post, Body } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

interface PostHogWebhook {
  event: string;
  properties?: Record<string, unknown>;
  distinct_id?: string;
  timestamp?: string;
}

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  async handleWebhook(@Body() payload: PostHogWebhook) {
    await this.webhooksService.handlePostHogEvent(payload);
    return { success: true };
  }
}

