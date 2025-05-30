import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';
import { getAwsCredentials } from '../common/utils/awsCredentials.util';

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

  async sendEmail(to: string, subject: string, htmlBody: string) {
    const params = {
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: {
            Data: htmlBody,
          },
        },
        Subject: {
          Data: subject,
        },
      },
      Source: `Compass Events <${process.env.MAIL_FROM_ADDRESS}>`,
    };

    const command = new SendEmailCommand(params);

    try {
      await this.sesClient.send(command);
    } catch (error) {
      Logger.error('Error sending email:', error);
      throw error;
    }
  }
}
