import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuid } from 'uuid';
import { SubscriptionController } from '../../src/subscriptions/subscriptions.controller';
import { SubscriptionService } from '../../src/subscriptions/subscriptions.service';
import { RoleGuard } from '../../src/common/guards/role.guard';
import { AuthGuard } from '../../src/common/guards/auth.guard';
import { Role } from '../../src/common/enum/roles.enum';
import { CreateSubscriptionDto } from '../../src/subscriptions/dto/create-subscription.dto';
import 'reflect-metadata';

const mockSubscriptionService = {
  findAllById: jest.fn(),
  create: jest.fn(),
  softDelete: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockRoleGuard = {
  canActivate: jest.fn(() => true),
};

function getMethodMetadata(controller: any, methodName: string) {
  const descriptor = Reflect.getOwnPropertyDescriptor(
    controller.prototype,
    methodName,
  );
  if (!descriptor) {
    throw new Error(`Method ${methodName} not found on controller`);
  }
  return descriptor.value;
}

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let service: SubscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRoleGuard)
      .compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
    service = module.get<SubscriptionService>(SubscriptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllById', () => {
    it('should call subscriptionService.findAllById with user ID', async () => {
      const userId = uuid();
      const mockReq = { user: { id: userId } };
      const expectedResult = { count: 0, data: [] };
      mockSubscriptionService.findAllById.mockResolvedValue(expectedResult);

      const result = await controller.findAllById(mockReq);

      expect(service.findAllById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });

    it('should apply AuthGuard and RoleGuard with correct roles', () => {
      const method = getMethodMetadata(SubscriptionController, 'findAllById');

      const guards = Reflect.getMetadata('__guards__', method);
      expect(guards).toEqual([AuthGuard, RoleGuard]);

      const roles = Reflect.getMetadata('roles', method);
      expect(roles).toEqual([Role.ADMIN, Role.ORGANIZER, Role.PARTICIPANT]);
    });
  });

  describe('create', () => {
    it('should call subscriptionService.create with provided data', async () => {
      const createSubscriptionDto: CreateSubscriptionDto = {
        user_id: uuid(),
        event_id: uuid(),
      };
      const expectedResult = { id: uuid(), ...createSubscriptionDto };
      mockSubscriptionService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createSubscriptionDto);

      expect(service.create).toHaveBeenCalledWith(createSubscriptionDto);
      expect(result).toEqual(expectedResult);
    });

    it('should apply AuthGuard and RoleGuard with correct roles', () => {
      const method = getMethodMetadata(SubscriptionController, 'create');

      const guards = Reflect.getMetadata('__guards__', method);
      expect(guards).toEqual([AuthGuard, RoleGuard]);

      const roles = Reflect.getMetadata('roles', method);
      expect(roles).toEqual([Role.PARTICIPANT, Role.ORGANIZER]);
    });
  });

  describe('delete', () => {
    it('should call subscriptionService.softDelete with subscription ID and user ID', async () => {
      const subscriptionId = uuid();
      const userId = uuid();
      const mockReq = { user: { id: userId } };
      mockSubscriptionService.softDelete.mockResolvedValue(undefined);

      await controller.delete(subscriptionId, mockReq);

      expect(service.softDelete).toHaveBeenCalledWith(subscriptionId, userId);
    });

    it('should apply AuthGuard and RoleGuard with correct roles', () => {
      const method = getMethodMetadata(SubscriptionController, 'delete');

      const guards = Reflect.getMetadata('__guards__', method);
      expect(guards).toEqual([AuthGuard, RoleGuard]);

      const roles = Reflect.getMetadata('roles', method);
      expect(roles).toEqual([Role.ORGANIZER, Role.PARTICIPANT]);
    });

    it('should have HttpCode 204 for successful deletion', () => {
      const method = getMethodMetadata(SubscriptionController, 'delete');

      const httpCode = Reflect.getMetadata('__httpCode__', method);
      expect(httpCode).toBe(204);
    });
  });
});
