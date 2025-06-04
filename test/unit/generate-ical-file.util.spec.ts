import { generateICalFile } from '../../src/common/utils/generate-ical-file.util';
import ical from 'ical-generator';

jest.mock('ical-generator', () => {
  const mockEvent = {
    id: jest.fn(),
    start: jest.fn(),
    summary: jest.fn(),
    description: jest.fn(),
    organizer: jest.fn(),
  };
  const mockCalendar = {
    createEvent: jest.fn(() => mockEvent),
    toString: jest.fn(() => 'mock-ical-string'),
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockCalendar),
  };
});

describe('generateICalFile', () => {
  const mockEventData = {
    id: 'event-123',
    name: 'Test Event',
    description: 'This is a test event.',
    startDate: new Date('2024-01-01T10:00:00.000Z'),
    organizer: 'Test Organizer',
    organizerEmail: 'organizer@example.com',
  };

  it('should create an iCalendar string with correct event details', () => {
    const icalString = generateICalFile(mockEventData);

    const calendarInstance = (ical as jest.Mock).mock.results[0].value;
    const createEventCall = calendarInstance.createEvent.mock.calls[0][0];

    expect(ical).toHaveBeenCalledWith({ name: 'Event Registration' });
    expect(calendarInstance.createEvent).toHaveBeenCalledTimes(1);

    expect(createEventCall.id).toBe(mockEventData.id);
    expect(createEventCall.start).toEqual(mockEventData.startDate);
    expect(createEventCall.summary).toBe(mockEventData.name);
    expect(createEventCall.description).toBe(mockEventData.description);
    expect(createEventCall.organizer).toEqual({
      name: mockEventData.organizer,
      email: mockEventData.organizerEmail,
    });

    expect(calendarInstance.toString).toHaveBeenCalledTimes(1);
    expect(icalString).toBe('mock-ical-string');
  });
});
