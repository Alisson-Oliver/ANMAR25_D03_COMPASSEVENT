import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import { getAwsCredentials } from '../common/utils/awsCredentials.util';
export class S3Service {
  private readonly s3: S3Client;

  constructor() {
    const { region, credentials } = getAwsCredentials();

    this.s3 = new S3Client({
      region,
      credentials,
    });
  }

  async uploadImage(
    image: Express.Multer.File,
    bucketName: string,
    folder: string,
  ) {
    const imageExtension = path.extname(image.originalname);
    const imageName = `${uuid()}${imageExtension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${folder}/${imageName}`,
      Body: image.buffer,
      ContentType: image.mimetype,
    });

    await this.s3.send(command);

    return `https://${bucketName}.s3.amazonaws.com/${folder}/${imageName}`;
  }
}
