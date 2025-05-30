export const verificationEmailTemplate = (name: string, url: string) =>
  `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Email Confirmation - Compass Events</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
      font-family: Arial, sans-serif;
    "
  >
    <table
      align="center"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="padding: 20px"
    >
      <tr>
        <td>
          <table
            align="center"
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="
              background-color: #ffffff;
              padding: 0;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
              overflow: hidden;
            "
          >
            <tr>
              <td>
                <img
                  src="https://plus.unsplash.com/premium_photo-1664041720567-d9600c62d5d8?q=80&w=1944&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Compass Events Banner"
                  style="
                    width: 100%;
                    height: 150px;
                    object-fit: cover;
                    border-radius: 12px 12px 0 0;
                  "
                />
              </td>
            </tr>

            <tr>
              <td align="center" style="padding: 24px">
                <h1 style="color: #222222; margin: 0 0 16px 0; font-size: 24px">
                  Welcome to <span style="color: #ff6b00">Compass Events</span>!
                </h1>
                <p
                  style="
                    font-size: 15px;
                    color: #444444;
                    line-height: 1.5;
                    margin: 0;
                  "
                >
                  Hi <strong>${name}</strong>,<br /><br />
                  We're thrilled to have you join our event platform! 🎉<br /><br />
                  Please verify your email by clicking the button below.<br /><br />
                  If you didn't create an account on Compass Events, ignore this
                  email.
                </p>

                <div style="margin: 24px 0">
                  <a
                    href="${url}"
                    style="
                      display: inline-block;
                      padding: 12px 28px;
                      background-color: #ff6b00;
                      color: #ffffff;
                      text-decoration: none;
                      border-radius: 6px;
                      font-weight: bold;
                      font-size: 15px;
                    "
                  >
                    Verify My Email
                  </a>
                </div>

                <p
                  style="
                    font-size: 11px;
                    color: #999999;
                    text-align: center;
                    line-height: 1.4;
                    border-top: 1px solid #eeeeee;
                    padding-top: 16px;
                  "
                >
                  This is an automated email, please do not reply.<br />
                  If the button doesn't work, copy and paste this link:<br />
                  <a href="${url}" style="color: #ff6b00">${url}</a>
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
