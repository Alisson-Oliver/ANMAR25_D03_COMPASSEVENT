import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from '../../src/events/events.controller';
import { S3Service } from '../../src/storages/aws-s3.service';
import { EventService } from '../../src/events/events.service';
import { Role } from '../../src/common/enum/roles.enum';
import { CreateEventDto } from '../../src/events/dto/create-event.dto';
import { EventPaginationQueryDto } from '../../src/events/dto/event-pagination-query.dto';
import { PatchEventDto } from '../../src/events/dto/patch-events.dto';

jest.mock('../../src/common/guards/auth.guard');
jest.mock('../../src/common/guards/role.guard');
jest.mock('../../src/common/pipes/validation-image.pipe');

describe('EventController', () => {
  let controller: EventController;
  let eventService: EventService;
  let s3Service: S3Service;

  const mockEventService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockS3Service = {
    uploadImage: jest.fn(),
  };

  const mockRequest = (user = { id: 'userId', role: Role.ORGANIZER }) => ({
    user,
    headers: {},
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    controller = module.get<EventController>(EventController);
    eventService = module.get<EventService>(EventService);
    s3Service = module.get<S3Service>(S3Service);

    process.env.S3_BUCKET_NAME = 'test-bucket';
    process.env.S3_EVENTS_FOLDER = 'events-test';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.S3_BUCKET_NAME;
    delete process.env.S3_EVENTS_FOLDER;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an event', async () => {
      const imageFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from(''),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'A test event',
        date: new Date(),
      };
      const req = mockRequest();
      const imageUrl = 'http://s3.amazon.com/test-bucket/events-test/image.jpg';
      const createdEvent = {
        id: '1',
        ...createEventDto,
        organizerId: req.user.id,
        imageUrl,
      };

      mockS3Service.uploadImage.mockResolvedValue(imageUrl);
      mockEventService.create.mockResolvedValue(createdEvent);

      const result = await controller.create(imageFile, req, createEventDto);

      expect(mockS3Service.uploadImage).toHaveBeenCalledWith(
        imageFile,
        'test-bucket',
        'events-test',
      );
      expect(mockEventService.create).toHaveBeenCalledWith(
        createEventDto,
        req.user,
        imageUrl,
      );
      expect(result).toEqual(createdEvent);
    });

    it('should throw an error if S3_BUCKET_NAME is not defined', async () => {
      delete process.env.S3_BUCKET_NAME;
      const imageFile = {} as Express.Multer.File;
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'A test event',
        date: new Date(),
      };
      const req = mockRequest();

      await expect(
        controller.create(imageFile, req, createEventDto),
      ).rejects.toThrow('S3_BUCKET_NAME environment variable is not defined');
    });
  });

  describe('findAll', () => {
    it('should return all events based on query', async () => {
      const query: EventPaginationQueryDto = { limit: 10, page: 1 };
      const expectedResult = {
        data: [],
        count: 0,
        lastKey: undefined,
        page: 1,
      };
      mockEventService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(mockEventService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should return a single event by id', async () => {
      const eventId = 'event1';
      const req = mockRequest();
      const expectedEvent = { id: eventId, name: 'Test Event' };
      mockEventService.findById.mockResolvedValue(expectedEvent);

      const result = await controller.findById(req, eventId);

      expect(mockEventService.findById).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(expectedEvent);
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const eventId = 'event1';
      const patchEventDto: PatchEventDto = { name: 'Updated Event Name' };
      const req = mockRequest({ id: 'organizerUserId', role: Role.ORGANIZER });
      mockEventService.update.mockResolvedValue(undefined);

      await controller.update(eventId, patchEventDto, req);

      expect(mockEventService.update).toHaveBeenCalledWith(
        eventId,
        patchEventDto,
        req.user.id,
        req.user.role,
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete an event', async () => {
      const eventId = 'event1';
      const req = mockRequest({ id: 'organizerUserId', role: Role.ORGANIZER });
      mockEventService.softDelete.mockResolvedValue(undefined);
      await controller.softDelete(eventId, req);

      expect(mockEventService.softDelete).toHaveBeenCalledWith(
        eventId,
        req.user.id,
        req.user.role,
      );
    });
  });
});
