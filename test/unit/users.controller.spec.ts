import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserController } from '../../src/users/users.controller';
import { UserService } from '../../src/users/users.service';
import { S3Service } from '../../src/storages/aws-s3.service';
import { AuthGuard } from '../../src/common/guards/auth.guard';
import { RoleGuard } from '../../src/common/guards/role.guard';
import { FormatPhonePipe } from '../../src/common/pipes/format-phone.pipe';
import { ValidationImagePipe } from '../../src/common/pipes/validation-image.pipe';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { Role } from '../../src/common/enum/roles.enum';
import { PaginationQueryDto } from '../../src/users/dto/user-pagination-query.dto';
import { PatchUserDto } from '../../src/users/dto/patch-user.dto';

import { Readable } from 'stream';

const mockFile: Express.Multer.File = {
  fieldname: 'image',
  originalname: 'test.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  size: 1024,
  buffer: Buffer.from('test'),
  stream: new Readable({ read() {} }),
  destination: '',
  filename: '',
  path: '',
};

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let s3Service: S3Service;

  const mockUserService = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockS3Service = {
    uploadImage: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRoleGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRoleGuard)
      .overrideInterceptor(FileInterceptor('image'))
      .useValue({
        intercept: (context, next) => next.handle(),
      })
      .overridePipe(FormatPhonePipe)
      .useValue({
        transform: (value) => value,
      })
      .overridePipe(ValidationImagePipe)
      .useValue({
        transform: (value) => value,
      })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    s3Service = module.get<S3Service>(S3Service);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '+55 (11) 99999-9999',
        role: Role.PARTICIPANT,
      };
      const imageUrl = 'http://s3.amazon.com/image.jpg';
      const expectedUser = { id: '1', ...createUserDto, avatar: imageUrl };

      process.env.S3_BUCKET_NAME = 'test-bucket';
      process.env.S3_USERS_FOLDER = 'users';

      mockS3Service.uploadImage.mockResolvedValue(imageUrl);
      mockUserService.create.mockResolvedValue(expectedUser);

      const result = await controller.create(mockFile, createUserDto);

      expect(mockS3Service.uploadImage).toHaveBeenCalledWith(
        mockFile,
        'test-bucket',
        'users',
      );
      expect(mockUserService.create).toHaveBeenCalledWith(
        createUserDto,
        imageUrl,
      );
      expect(result).toEqual(expectedUser);
    });

    it('should throw error if S3_BUCKET_NAME is not defined', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '+55 (11) 99999-9999',
        role: Role.PARTICIPANT,
      };
      delete process.env.S3_BUCKET_NAME;

      await expect(controller.create(mockFile, createUserDto)).rejects.toThrow(
        Error,
      );
      expect(mockS3Service.uploadImage).not.toHaveBeenCalled();
      expect(mockUserService.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a user by ID if user requests their own profile', async () => {
      const userId = '1';
      const mockReq = { user: { id: userId, role: Role.PARTICIPANT } };
      const expectedUser = { id: userId, name: 'Test User' };

      mockUserService.findById.mockResolvedValue(expectedUser);

      const result = await controller.findById(userId, mockReq);

      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedUser);
    });

    it('should throw ForbiddenException if user requests another user profile', async () => {
      const userId = '1';
      const mockReq = { user: { id: '2', role: Role.PARTICIPANT } };

      await expect(controller.findById(userId, mockReq)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUserService.findById).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return a list of users (admin access)', async () => {
      const query: PaginationQueryDto = { limit: 10, page: 1 };
      const expectedResult = {
        count: 1,
        data: [{ id: '1', name: 'Test User' }],
        lastKey: undefined,
      };
      mockUserService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(mockUserService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a user if user updates their own profile', async () => {
      const userId = '1';
      const patchUserDto: PatchUserDto = { name: 'Updated Name' };
      const mockReq = { user: { id: userId, role: Role.PARTICIPANT } };
      mockUserService.update.mockResolvedValue({
        /* updated user object */
      });

      await controller.update(userId, patchUserDto, mockReq);

      expect(mockUserService.update).toHaveBeenCalledWith(userId, patchUserDto);
    });

    it('should throw ForbiddenException if user tries to update another profile', async () => {
      const userId = '1';
      const patchUserDto: PatchUserDto = { name: 'Updated Name' };
      const mockReq = { user: { id: '2', role: Role.PARTICIPANT } };

      await expect(
        controller.update(userId, patchUserDto, mockReq),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUserService.update).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('should soft delete a user if user deletes their own profile', async () => {
      const userId = '1';
      const mockReq = { user: { id: userId, role: Role.PARTICIPANT } };
      mockUserService.softDelete.mockResolvedValue(true);

      await controller.softDelete(userId, mockReq);

      expect(mockUserService.softDelete).toHaveBeenCalledWith(userId);
    });

    it('should soft delete a user if admin deletes any profile', async () => {
      const userId = '2';
      const mockReq = { user: { id: '1', role: Role.ADMIN } };
      mockUserService.softDelete.mockResolvedValue(true);

      await controller.softDelete(userId, mockReq);

      expect(mockUserService.softDelete).toHaveBeenCalledWith(userId);
    });

    it('should throw ForbiddenException if non-admin user tries to delete another profile', async () => {
      const userId = '2';
      const mockReq = { user: { id: '1', role: Role.PARTICIPANT } };
      await expect(controller.softDelete(userId, mockReq)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUserService.softDelete).not.toHaveBeenCalled();
    });
  });
});
