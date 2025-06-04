import { InternalServerErrorException } from '@nestjs/common';

export function getAwsCredentials() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  const sessionToken = process.env.AWS_SESSION_TOKEN;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new InternalServerErrorException(
      'AWS credentials or region are not defined in .env',
    );
  }

  const credentials = sessionToken
    ? { accessKeyId, secretAccessKey, sessionToken }
    : { accessKeyId, secretAccessKey };

  return { region, credentials };
}
