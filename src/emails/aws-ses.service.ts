import {
  SendEmailCommand,
  SendRawEmailCommand,
  SESClient,
} from '@aws-sdk/client-ses';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { getAwsCredentials } from '../common/utils/awsCredentials.util';
import { EmailSendStatus } from '../common/enum/email-send-status.enum';
import ical from 'ical-generator';

export interface ICalendarAttachment {
  fileName: string;
  content: string;
  method?: string;
}

@Injectable()
export class SESMailService {
  private readonly sesClient: SESClient;

  constructor() {
    const { region, credentials } = getAwsCredentials();

    this.sesClient = new SESClient({
      region,
      credentials,
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    icalAttachment?: ICalendarAttachment,
  ): Promise<EmailSendStatus> {
    const enableEmailSending = process.env.ENABLE_EMAIL_SENDING === 'true';

    if (!process.env.MAIL_FROM_ADDRESS && enableEmailSending) {
      throw new BadRequestException(
        'MAIL_FROM_ADDRESS environment variable is not defined',
      );
    }

    if (!enableEmailSending) {
      Logger.warn('Email sending is disabled.');
      return EmailSendStatus.DISABLED;
    }
    try {
      let command;

      if (icalAttachment) {
        const rawMessageData = this._buildRawEmailData(
          to,
          String(process.env.MAIL_FROM_ADDRESS),
          subject,
          htmlBody,
          icalAttachment,
        );
        command = new SendRawEmailCommand({
          RawMessage: { Data: rawMessageData },
          Destinations: [to],
          Source: String(process.env.MAIL_FROM_ADDRESS),
        });
      } else {
        command = new SendEmailCommand({
          Destination: { ToAddresses: [to] },
          Message: {
            Body: { Html: { Data: htmlBody } },
            Subject: { Data: subject },
          },
          Source: String(process.env.MAIL_FROM_ADDRESS),
        });
      }

      await this.sesClient.send(command);
      return EmailSendStatus.SENT;
    } catch (error) {
      Logger.error('Error sending email:', error);
      return EmailSendStatus.FAILED;
    }
  }

  private _buildRawEmailData(
    to: string,
    sourceEmail: string,
    subject: string,
    htmlBody: string,
    icalAttachment: ICalendarAttachment,
  ): Uint8Array {
    const boundary = `----NextPart_${Math.random().toString(36).substring(2)}`;

    const date = new Date().toUTCString();
    const messageId = `<${Date.now()}.${Math.random()
      .toString(36)
      .substring(2)}@${sourceEmail.split('@')[1]}>`;

    let raw = '';

    raw += `From: Compass Events <${sourceEmail}>\r\n`;
    raw += `To: ${to}\r\n`;
    raw += `Subject: ${subject}\r\n`;
    raw += `Message-ID: ${messageId}\r\n`;
    raw += `Date: ${date}\r\n`;
    raw += `MIME-Version: 1.0\r\n`;
    raw += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

    raw += `--${boundary}\r\n`;
    raw += `Content-Type: text/html; charset="UTF-8"\r\n`;
    raw += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    raw += `${htmlBody}\r\n\r\n`;

    raw += `--${boundary}\r\n`;
    raw += `Content-Type: text/calendar; charset="UTF-8"; method=${
      icalAttachment.method || 'PUBLISH'
    }; name="${icalAttachment.fileName}"\r\n`;
    raw += `Content-Disposition: attachment; filename="${icalAttachment.fileName}"\r\n`;
    raw += `Content-Transfer-Encoding: base64\r\n\r\n`;
    raw += `${Buffer.from(icalAttachment.content).toString('base64')}\r\n\r\n`;

    raw += `--${boundary}--`;

    return Buffer.from(raw);
  }
}
