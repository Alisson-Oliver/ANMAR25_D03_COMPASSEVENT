import { Module } from '@nestjs/common';
import { SESMailService } from './aws-ses.service';

@Module({
  imports: [],
  providers: [SESMailService],
  exports: [SESMailService],
})
export class SESMailModule {}
