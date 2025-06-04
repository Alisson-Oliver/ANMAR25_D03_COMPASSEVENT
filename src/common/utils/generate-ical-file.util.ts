import ical from 'ical-generator';

export function generateICalFile(event: {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  organizer: string;
  organizerEmail: string;
}) {
  const calendar = ical({ name: 'Event Registration' });

  calendar.createEvent({
    id: event.id,
    start: event.startDate,
    summary: event.name,
    description: event.description,
    organizer: {
      name: event.organizer,
      email: event.organizerEmail,
    },
  });

  return calendar.toString();
}
