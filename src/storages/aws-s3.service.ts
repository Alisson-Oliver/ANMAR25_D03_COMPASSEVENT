import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import { getAwsCredentials } from '../common/utils/awsCredentials.util';
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket = process.env.S3_BUCKET_NAME;

  constructor() {
    const { region, credentials } = getAwsCredentials();

    this.s3 = new S3Client({
      region,
      credentials,
    });
  }

  async uploadFile(file: Express.Multer.File) {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuid()}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3.send(command);

    return 'https://' + this.bucket + '.s3.amazonaws.com/' + fileName;
  }
}
