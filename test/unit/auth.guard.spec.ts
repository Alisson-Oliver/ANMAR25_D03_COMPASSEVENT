import { AuthService } from '../../src/auth/auth.service';
import { AuthGuard } from '../../src/common/guards/auth.guard';
import { UserService } from '../../src/users/users.service';
import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: AuthService;
  let userService: UserService;

  const mockAuthService = {
    checkToken: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnThis(),
    getRequest: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if token is valid and user exists', async () => {
    const mockRequest = {
      headers: { authorization: 'Bearer valid-token' },
      tokenPayload: undefined,
      user: undefined,
    };
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);

    const decodedToken = {
      id: 'user-id',
      email: 'test@example.com',
      role: 'participant',
    };
    const user = { id: 'user-id', name: 'Test User' };

    mockAuthService.checkToken.mockReturnValue(decodedToken);
    mockUserService.findById.mockResolvedValue(user as any);

    const result = await guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    expect(mockAuthService.checkToken).toHaveBeenCalledWith('valid-token');
    expect(mockUserService.findById).toHaveBeenCalledWith(decodedToken.id);
    expect(mockRequest.tokenPayload).toEqual(decodedToken);
    expect(mockRequest.user).toEqual(user);
  });

  it('should return false if authorization header is missing', async () => {
    const mockRequest = { headers: {} };
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);
    mockAuthService.checkToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(false);
    expect(mockAuthService.checkToken).toHaveBeenCalledWith(undefined);
  });

  it('should return false if token is invalid', async () => {
    const mockRequest = { headers: { authorization: 'Bearer invalid-token' } };
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);
    mockAuthService.checkToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const result = await guard.canActivate(mockExecutionContext);

    expect(result).toBe(false);
  });

  it('should return false if user is not found', async () => {
    const mockRequest = {
      headers: { authorization: 'Bearer valid-token' },
    };
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);

    const decodedToken = {
      id: 'user-id',
      email: 'test@example.com',
      role: 'participant',
    };
    mockAuthService.checkToken.mockReturnValue(decodedToken);
    mockUserService.findById.mockResolvedValue(null);

    const result = await guard.canActivate(mockExecutionContext);

    expect(result).toBe(false);
  });

  it('should handle errors during token check gracefully', async () => {
    const mockRequest = { headers: { authorization: 'Bearer error-token' } };
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue(mockRequest);
    mockAuthService.checkToken.mockImplementation(() => {
      throw new Error('Some unexpected error');
    });

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(false);
  });
});
