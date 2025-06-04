# Compass Events - API RESTful

[![Node.js Version](https://img.shields.io/badge/Node.js-^22.10.7-brightgreen)](https://nodejs.org/) [![NestJS](https://img.shields.io/badge/NestJS-^11.0.1-red?logo=nestjs&logoColor=white)](https://nestjs.com/) [![Swagger](https://img.shields.io/badge/Swagger-^11.2.0-darkgreen?logo=swagger)](https://swagger.io/)

## 📘 Description

The **Compass Events API** is a RESTful application dedicated to creating, managing, and registering events within the Compass Events platform.

Built using **NestJS** with **TypeScript**, it utilizes **Amazon DynamoDB** as its database, **Amazon S3** for file storage, and **Amazon SES** for email services. It also features automatic API documentation with **Swagger**.

## 🧩 API Modules

The API provides full **CRUD** functionality and business rules for the following domains:

- **Auth**: User authentication and email verification.
- **Users**: User registration, profile management, and administration.
- **Events**: Event creation, management, and discovery.
- **Subscriptions**: User registration for events.
- **Seed**: Initial data seeding for the application.

### In this project, you can access various sections. Click the links below to navigate:

- [Endpoints](#endpoints)
- [Authentication](#authentication)
- [Email configuration](#email-configuration)

## 💻 Technologies

### Backend

![NestJS](https://img.shields.io/badge/NestJS-^11.0.1-E0234E?style=for-the-badge&logo=nestjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-^5.7.3-blue?style=for-the-badge&logo=typescript&logoColor=white)

### Cloud Services & Database

![AWS DynamoDB](https://img.shields.io/badge/AWS%20DynamoDB-4053D6?style=for-the-badge&logo=amazon-dynamodb&logoColor=white) ![AWS S3](https://img.shields.io/badge/AWS%20S3-569A31?style=for-the-badge&logo=amazon-s3&logoColor=white) ![AWS SES](https://img.shields.io/badge/AWS%20SES-FF4F8B?style=for-the-badge&logo=amazon-ses&logoColor=white)

### Documentation

![Swagger](https://img.shields.io/badge/Swagger-^11.2.0-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white)

## 📋 Prerequisites

- **Node.js** installed (v22.10.7 or higher recommended)
- **Package manager** (_npm_ or _yarn_)
- **AWS Account** configured with credentials for DynamoDB, S3, and SES.

## ⚙️ Environment Variables

Create a `.env` file in the project root with the following settings:

```env
# AWS Credentials
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_SESSION_TOKEN=your-aws-session-token # Optional, if using temporary credentials

# DynamoDB
DYNAMODB_TABLE_USERS=users
DYNAMODB_TABLE_EVENTS=events
DYNAMODB_TABLE_SUBSCRIPTIONS=subscriptions

# S3
S3_BUCKET_NAME=your-s3-bucket-name
S3_EVENTS_FOLDER=events
S3_USERS_FOLDER=users

# SES
ENABLE_EMAIL_SENDING=true # or false
MAIL_FROM_ADDRESS=your-verified-email@example.com

# JWT
JWT_SECRET=your-strong-jwt-secret
JWT_LOGIN_EXPIRES_IN=7d
JWT_EMAIL_VERIFICATION_EXPIRES_IN=30m

# Server
API_BASE_URL=http://localhost:3000 # Or your deployment URL
API_PORT=3000

# Admin User (for seeding)
DEFAULT_USER_NAME=Admin
DEFAULT_USER_EMAIL=admin@example.com
DEFAULT_USER_PASSWORD=YourSecurePassword!123
```

## 🚀 How to Run the Project

1.  Clone the repository:

    ```bash
    git clone https://github.com/Alisson-Oliver/ANMAR25_D03_COMPASSEVENT.git
    cd ANMAR25_D03_COMPASSEVENT
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Ensure your AWS credentials and services (DynamoDB tables, S3 bucket, SES verified email) are configured.

4.  Start the project in development mode or production mode:

    ```bash
    npm run dev
    npm run start
    ```

#### NPM Run Scripts:

- `npm run build`: Compiles the TypeScript project.
- `npm run format`: Formats code using Prettier.
- `npm run start`: Starts the application (requires prior build).
- `npm run dev`: Starts the application in watch mode for development.
- `npm run lint`: Lints the codebase with ESLint.
- `npm run test`: Runs Jest tests.
- `npm run seed:dev`: Runs the database seed script using `ts-node` (for development).
- `npm run seed`: Runs the compiled database seed script (for production/after build).

It's recommended to use `npm run seed:dev` (or `npm run seed` after building) to generate the initial seed with an Admin User using the credentials specified in your `.env` file.

## 📚 Swagger Documentation

Access the `/api/v1/api-docs` endpoint after starting the server to view the API documentation generated with Swagger.

Example: `http://localhost:3000/api/v1/api-docs`

# Endpoints

The API prefix is `/api/v1`.

## Auth

- `POST /auth/login` - User login.
- `GET /auth/verify-email?token=<token>` - Verify email address.

## Users

- `POST /users` - Create a new user (Organizer/Participant).
- `GET /users` - Get list of all users (Admin only).
- `GET /users/:id` - Get a single user by ID (Owner or Admin).
- `PATCH /users/:id` - Update user information (Owner only).
- `DELETE /users/:id` - Soft delete a user (Owner or Admin).

## Events

- `POST /events` - Create a new event (Admin/Organizer only).
- `GET /events` - Get list of all events (Authenticated users).
- `GET /events/:id` - Get event by ID (Authenticated users).
- `PATCH /events/:id` - Update an event (Admin/Organizer who owns the event).
- `DELETE /events/:id` - Soft delete an event (Admin/Organizer who owns the event).

## Subscriptions

- `POST /subscriptions` - Create a new subscription to an event (Participant/Organizer).
- `GET /subscriptions` - Get list of subscriptions for the logged-in user.
- `DELETE /subscriptions/:id` - Soft delete a subscription (Owner of the subscription).

## 📁 Folder Structure

```
src/
│
├── app.module.ts     # Root module of the application
├── main.ts           # Application entry point
│
├── auth/             # Authentication (login, email verification) and authorization logic
│   ├── dto/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
│
├── common/           # Shared utilities, guards, pipes, decorators, enums
│   ├── decorators/
│   ├── dto/
│   ├── enums/        # Role, Status, EmailSendStatus enums
│   ├── guards/       # AuthGuard, RoleGuard
│   ├── pipes/        # FormatPhonePipe, ValidationImagePipe
│   └── utils/        # awsCredentials, generate-ical, pagination utils
│
├── database/         # DynamoDB connection and service
│   ├── dynamodb.module.ts
│   └── dynamodb.service.ts
│
├── emails/           # AWS SES email sending service and templates
│   ├── templates/
│   │   ├── events/
│   │   ├── subscriptions/
│   │   └── users/
│   ├── aws-ses.module.ts
│   └── aws-ses.service.ts
│
├── events/           # Event management module
│   ├── dto/
│   ├── events.controller.ts
│   ├── events.module.ts
│   └── events.service.ts
│
├── seed/             # Database seeding functionality
│   ├── seed.module.ts
│   ├── seed.service.ts
│   └── seed.ts
│
├── storages/         # AWS S3 file storage service
│   ├── aws-s3.module.ts
│   └── aws-s3.service.ts
│
├── subscriptions/    # Event subscription management module
│   ├── dto/
│   ├── subscriptions.controller.ts
│   ├── subscriptions.module.ts
│   └── subscriptions.service.ts
│
└── users/            # User management module
    ├── dto/
    ├── users.controller.ts
    ├── users.module.ts
    └── users.service.ts
```

---

# Authentication

## 🔑 Authentication and Token Usage

After a new user registers (or after running `npm run seed:dev` / `npm run seed`), users can obtain an access token to interact with the API's protected routes.

**Login Flow:**

1.  Use the authentication route `POST /api/v1/auth/login` with the user's email and password.

    - **Admin User (Seed):** Use the `DEFAULT_USER_EMAIL` and `DEFAULT_USER_PASSWORD` defined in the `.env`.
    - **Registered User:** Use the email and password provided during the registration process.

2.  The response from this route will be a JSON object containing the `accessToken`.

**Using the Token:**

To access the API's protected routes, you need to include the `accessToken` in the `Authorization` header of your HTTP request, using the **Bearer Token** scheme.

**Example of how to configure in Postman:**

1.  In the "Authorization" tab of your request.
2.  Select the "Bearer Token" type.
3.  In the "Token" field, paste the `accessToken` received in the login response.

After configuring the `Authorization` with the Bearer Token, your requests to protected routes will be authenticated.

**User Roles:**

- **`ADMIN`**: Full access to all API functionalities. The default seeded user has this role.
- **`ORGANIZER`**: Can create and manage their own events, and perform actions available to participants.
- **`PARTICIPANT`**: Can subscribe to events and manage their own subscriptions and profile.

Make sure to store the token securely. The token includes user ID, email, and role.

# Email Configuration

Email sending is handled by **AWS SES (Simple Email Service)**.

1.  **Configure AWS Credentials**: Ensure your `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (and `AWS_SESSION_TOKEN` if applicable) are correctly set in your `.env` file. These credentials need permissions for SES.
2.  **Verify Email Address/Domain in SES**: The email address specified in `MAIL_FROM_ADDRESS` must be verified in AWS SES in the same region to be ableto send emails. For production, verifying your domain is recommended.
3.  **Enable/Disable Email Sending**:
    - Set `ENABLE_EMAIL_SENDING=true` in your `.env` file to allow emails to be sent.
    - Set `ENABLE_EMAIL_SENDING=false` to disable email sending (useful for development or testing environments where emails are not required or SES is not configured). If disabled, a warning will be logged.
    - For user email verification, if `ENABLE_EMAIL_SENDING` is `false`, the system will automatically mark the user's email as verified to allow for local development without email sending setup.

Emails are sent for:

- User email verification.
- Account deletion confirmation.
- Event creation confirmation (to organizer).
- Event deletion confirmation (to organizer).
- Subscription confirmation (to participant, with .ics calendar invite).
- Subscription cancellation confirmation (to participant).

## 🤝 Contribution

- Follow Gitflow: `feature/feature-name`, `fix/bug-fix`, etc.
- Use semantic commits (`feat:`, `fix:`, `docs:`)
- Pull Requests (PRs) must include a clear description of changes.

## 📄 License

This project is under the [MIT License](./LICENSE).
