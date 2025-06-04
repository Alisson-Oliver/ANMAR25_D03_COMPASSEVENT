import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { AuthLoginDto } from '../../src/auth/dto/auth-login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    verifyEmail: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail with the token', async () => {
      const token = 'test-token';
      const expectedResult = { message: 'Email verified' };
      mockAuthService.verifyEmail.mockResolvedValue(expectedResult);

      const result = await controller.verifyEmail(token);

      expect(authService.verifyEmail).toHaveBeenCalledWith(token);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login with email and password', async () => {
      const authLoginDto: AuthLoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { accessToken: 'some-token' };
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(authLoginDto);

      expect(authService.login).toHaveBeenCalledWith(
        authLoginDto.email,
        authLoginDto.password,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
