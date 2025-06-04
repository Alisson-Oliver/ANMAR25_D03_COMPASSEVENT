import {
  Injectable,
  PipeTransform,
  BadRequestException,
  UnsupportedMediaTypeException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Express } from 'express';

export interface ImageValidationPipeOptions {
  allowedMimeTypes?: string[];
  maxFileSize?: number;
  errorMessageForMissingFile?: string;
  fileIsRequired?: boolean;
}

@Injectable()
export class ValidationImagePipe
  implements
    PipeTransform<
      Express.Multer.File | undefined,
      Promise<Express.Multer.File | undefined>
    >
{
  private readonly options: Required<
    Omit<ImageValidationPipeOptions, 'errorMessageForMissingFile'>
  > &
    Pick<ImageValidationPipeOptions, 'errorMessageForMissingFile'>;

  constructor(options: ImageValidationPipeOptions = {}) {
    this.options = {
      allowedMimeTypes: options.allowedMimeTypes || [
        'image/jpeg',
        'image/png',
        'image/jpg',
      ],
      maxFileSize: options.maxFileSize || 15 * 1024 * 1024,
      errorMessageForMissingFile:
        options.errorMessageForMissingFile ||
        'No file uploaded. Please upload an image.',
      fileIsRequired:
        options.fileIsRequired === undefined ? true : options.fileIsRequired,
    };
  }

  async transform(
    file: Express.Multer.File | undefined,
  ): Promise<Express.Multer.File | undefined> {
    if (!file) {
      if (this.options.fileIsRequired) {
        throw new BadRequestException(this.options.errorMessageForMissingFile);
      }

      return undefined;
    }

    const { mimetype, size } = file;

    if (!this.options.allowedMimeTypes.includes(mimetype)) {
      throw new UnsupportedMediaTypeException(
        `Unsupported file type: ${mimetype}. Allowed types: ${this.options.allowedMimeTypes.join(', ')}`,
      );
    }

    if (size > this.options.maxFileSize) {
      const maxSizeMB = this.options.maxFileSize / (1024 * 1024);
      const fileSizeMB = parseFloat((size / (1024 * 1024)).toFixed(2));
      throw new PayloadTooLargeException(
        `File size (${fileSizeMB}MB) exceeds the limit of ${maxSizeMB}MB.`,
      );
    }

    return file;
  }
}
