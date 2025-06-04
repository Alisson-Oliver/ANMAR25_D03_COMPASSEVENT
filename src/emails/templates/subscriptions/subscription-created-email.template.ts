export const subscriptionCreatedEmailTemplate = (
  userName: string,
  eventName: string,
  eventDateTimeISO: string,
  eventImageUrl?: string,
) => {
  const eventDate = new Date(eventDateTimeISO);
  const formattedDate = eventDate.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const defaultBanner =
    'https://plus.unsplash.com/premium_photo-1664041720567-d9600c62d5d8?q=80&w=1944&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

  const imageUrl = eventImageUrl || defaultBanner;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Subscription Confirmed - ${eventName}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: Arial, sans-serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
      <tr>
        <td>
          <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); overflow: hidden;">
            <tr>
              <td>
                <img src="${imageUrl}" alt="Event Image" style="width: 100%; height: 150px; object-fit: cover; border-radius: 12px 12px 0 0;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 24px;">
                <h1 style="color: #222222; margin: 0 0 16px 0; font-size: 24px;">
                  Subscription Confirmed for <span style="color: #ff6b00;">${eventName}</span>!
                </h1>
                <p style="font-size: 15px; color: #444444; line-height: 1.5; margin: 0 0 16px 0;">
                  Hello <strong>${userName}</strong>,<br /><br />
                  Your subscription for the event <strong>"${eventName}"</strong> has been successfully confirmed.<br /><br />
                  <strong>Date & Time:</strong> ${formattedDate}<br /><br />
                  The event has been added to your calendar. Please check the attached <strong>.ics</strong> file to save it.<br /><br />
                  We look forward to seeing you at the event!
                </p>
                <p style="font-size: 12px; color: #999999; text-align: center; line-height: 1.4; border-top: 1px solid #eeeeee; padding-top: 16px; margin-top: 24px;">
                  This is an automated email. Please do not reply.<br />
                  For assistance, visit our support page: 
                  <a href="https://compassevents.com/support" style="color: #ff6b00;">compassevents.com/support</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};
