import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../src/users/users.service';
import { AuthService } from '../../src/auth/auth.service';

jest.mock('bcrypt');

beforeAll(() => {
  jest.spyOn(Logger, 'error').mockImplementation(jest.fn());
});

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userService: UserService;

  const mockUserService = {
    emailExists: jest.fn(),
    verifyUserEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLoginToken', () => {
    it('should create and return an access token', () => {
      const user = { id: '1', email: 'test@example.com', role: 'user' };
      const expectedToken = 'signed-jwt-token';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = service.createLoginToken(user);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { id: user.id, email: user.email, role: user.role },
        { expiresIn: '7d', algorithm: 'HS256', audience: 'users' },
      );
      expect(result).toEqual({ accessToken: expectedToken });
    });
  });

  describe('checkToken', () => {
    it('should verify and return decoded token', () => {
      const token = 'valid-token';
      const decoded = { userId: '1' };
      mockJwtService.verify.mockReturnValue(decoded);

      const result = service.checkToken(token);

      expect(mockJwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'test-secret',
      });
      expect(result).toEqual(decoded);
    });

    it('should throw BadRequestException for invalid token', () => {
      const token = 'invalid-token';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt verify error');
      });

      expect(() => service.checkToken(token)).toThrow(BadRequestException);
      expect(Logger.error).toHaveBeenCalledWith(
        'Invalid token',
        expect.any(Error),
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };
    const mockUser = {
      id: '1',
      email: loginDto.email,
      password: 'hashedPassword',
      deletedAt: null,
      emailVerified: true,
      role: 'participant',
    };

    it('should login successfully and return token', async () => {
      mockUserService.emailExists.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('access-token');

      const result = await service.login(loginDto.email, loginDto.password);

      expect(userService.emailExists).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result).toEqual({ accessToken: 'access-token' });
    });

    it('should throw BadRequestException if user does not exist', async () => {
      mockUserService.emailExists.mockResolvedValue(null);
      await expect(
        service.login(loginDto.email, loginDto.password),
      ).rejects.toThrow(new BadRequestException('invalid email or password'));
    });

    it('should throw BadRequestException if user account is deleted', async () => {
      mockUserService.emailExists.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });
      await expect(
        service.login(loginDto.email, loginDto.password),
      ).rejects.toThrow(new BadRequestException('user account is deleted'));
    });

    it('should throw BadRequestException if email is not verified', async () => {
      mockUserService.emailExists.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      await expect(
        service.login(loginDto.email, loginDto.password),
      ).rejects.toThrow(new BadRequestException('email not verified'));
    });

    it('should throw BadRequestException if password does not match', async () => {
      mockUserService.emailExists.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login(loginDto.email, loginDto.password),
      ).rejects.toThrow(new BadRequestException('invalid email or password'));
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and return data', async () => {
      const token = 'verification-token';
      const decodedData = { sub: 'user-id', email: 'test@example.com' };
      mockJwtService.verify.mockReturnValue(decodedData);
      mockUserService.verifyUserEmail.mockResolvedValue({} as any);

      const result = service.verifyEmail(token);

      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
      expect(mockUserService.verifyUserEmail).toHaveBeenCalledWith(
        decodedData.sub,
      );
      expect(result).toEqual(decodedData);
    });

    it('should throw BadRequestException if token verification fails', () => {
      const token = 'invalid-verification-token';
      const error = new Error('Verification failed');
      mockJwtService.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => service.verifyEmail(token)).toThrow(
        new BadRequestException(error),
      );
    });
  });
});
