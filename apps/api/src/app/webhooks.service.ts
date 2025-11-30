import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

interface PostHogWebhook {
  event: string;
  properties?: Record<string, unknown>;
  distinct_id?: string;
  timestamp?: string;
}

@Injectable()
export class WebhooksService {
  private readonly trainingDataFile = join(process.cwd(), 'training_data.jsonl');

  async handlePostHogEvent(payload: PostHogWebhook) {
    const event = payload.event;

    // handle generation_failed events for training data
    if (event === 'generation_failed') {
      await this.saveTrainingData(payload);
    }

    // could add marketing handler here if needed
    // if (event === 'feature_used') { ... }
  }

  private async saveTrainingData(payload: PostHogWebhook) {
    const properties = payload.properties || {};
    
    // sanitize the input prompt
    const inputPrompt = typeof properties.input_prompt === 'string' 
      ? properties.input_prompt.trim() 
      : '';
    
    const failureReason = typeof properties.failure_reason === 'string'
      ? properties.failure_reason.trim()
      : 'unknown';

    if (!inputPrompt) {
      return; // skip if no valid prompt
    }

    const trainingRecord = {
      timestamp: payload.timestamp || new Date().toISOString(),
      event: payload.event,
      failure_reason: failureReason,
      input_prompt: inputPrompt,
      distinct_id: payload.distinct_id,
    };

    // write to file non-blocking
    const line = JSON.stringify(trainingRecord) + '\n';
    await fs.appendFile(this.trainingDataFile, line, 'utf8');
  }
}

