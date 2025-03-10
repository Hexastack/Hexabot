import { Module } from '@nestjs/common';
import { CustomEventEmitterService } from './custom-event-emitter.service';

@Module({
  providers: [CustomEventEmitterService]
})
export class CustomEventEmitterModule {}
