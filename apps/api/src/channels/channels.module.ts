import { Module } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { WebhookEmitterService } from './webhook-emitter.service';

@Module({
  controllers: [ChannelsController],
  providers: [ChannelsService, WebhookEmitterService],
  exports: [WebhookEmitterService],
})
export class ChannelsModule {}
