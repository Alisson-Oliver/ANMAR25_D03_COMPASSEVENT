export const accountDeletedEmailTemplate = (name: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>We're Sorry to See You Go - Compass Events</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="padding: 30px;">
    <tr>
      <td>
        <table align="center" width="600" cellpadding="0" cellspacing="0" 
          style="background-color:#ffffff; padding:40px; border-radius:16px; 
          box-shadow:0 8px 24px rgba(0,0,0,0.12);">
          
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h1 style="color:#333333; margin:0; font-weight:700; font-size:28px;">
                Account <span style="color:#FF6B00;">Deleted</span>
              </h1>
              <p style="color:#777777; font-size:14px; margin-top:4px;">We’re sorry to see you leave, ${name}</p>
            </td>
          </tr>

          <tr>
            <td>
              <p style="font-size:16px; color:#555555; line-height:1.6;">
                Your Compass Events account has been successfully deleted.<br /><br />
                All your personal data has been securely removed from our system.<br /><br />
                If this was a mistake or you want to come back, you’re always welcome to create a new account anytime.<br /><br />
                For any questions or support, please <a href="https://compassevents.com/support" style="color:#FF6B00; text-decoration:none;">contact our team</a>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:30px; border-top:1px solid #eeeeee; text-align:center;">
              <p style="font-size:12px; color:#aaaaaa; margin:0;">
                This is an automated message. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
