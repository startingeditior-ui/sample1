# MedLinkID - Digital Medical Record Exchange Platform

![MedLinkID](ML.png)

MedLinkID is a comprehensive digital health identity and medical record exchange platform that empowers patients with complete ownership and control over their medical history across multiple healthcare providers—without the need to carry physical files.

This repository contains both the **Patient App** (Frontend) and the **Core API** (Backend) in a monorepo structure.

---

## Table of Contents

1. [Goals & Objectives](#goals--objectives)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)
9. [New Features](#new-features)
10. [Security](#security)
11. [License](#license)

---

## Goals & Objectives

MedLinkID was built with a clear mission: to give patients ultimate control over their medical data.

- **Patient Data Ownership** - Patients maintain ownership of their complete medical history across all healthcare providers
- **Secure Record Sharing** - Share medical records securely with any connected hospital or doctor
- **Real-Time Transparency** - Patients always know exactly who is accessing their records and when
- **Complete Access Control** - Approve, revoke, and audit all record access with a single tap
- **Emergency Access** - Support emergency scenarios with limited data disclosure when the patient is unable to respond

---

## Key Features

MedLinkID provides a comprehensive set of features designed with patient control and security in mind.

### 1. Patient Identity Management
- **Patient ID System** - Unique identifier for each patient
- **QR Code Sharing** - Share Patient ID via QR code for quick hospital registration
- **Profile Management** - Complete profile with medical info (blood group, allergies, chronic diseases)

### 2. Consent Management
- **Request-Based Access** - Hospitals/doctors must request access to patient records
- **Approve/Reject Requests** - Patients can approve or reject access requests
- **Configurable Duration** - Set how long access remains valid (1 hour to 7 days)
- **Record Type Selection** - Choose which specific records to share

### 3. Access Control Dashboard
- **Active Access Monitor** - View all currently active record accesses
- **Instant Revocation** - Revoke access at any time with immediate effect
- **Access Extension** - Extend access duration if needed
- **Hospital Blocking** - Block specific hospitals from requesting access

### 4. Real-Time Notifications
- **Live Push Notifications** - Instant alerts when records are accessed
- **Consent Request Alerts** - Immediate notification when a hospital requests access
- **Access Expiry Warnings** - Notifications before access expires
- **Notification History** - View all past notifications

### 5. Emergency Mode
- **Guardian Contact** - Designated emergency contact who can act on patient's behalf
- **Limited Emergency Access** - Doctors can access critical info in emergencies
- **Full Audit Trail** - All emergency access is logged for accountability
- **Guardian Location** - Optional guardian location tracking for emergencies

### 6. Audit & Logging
- **Complete Audit Trail** - Every record access is logged with timestamp
- **Access History** - View who accessed what records and when
- **IP Address Tracking** - Record IP address of all access attempts
- **Doctor & Hospital Tracking** - Track which healthcare providers accessed data

### 7. Communication Services
- **Email Notifications** - Welcome emails, verification, and alerts via SMTP
- **SMS/OTP Authentication** - Secure login via one-time passwords
- **Real-Time Updates** - Socket.io for instant UI updates

---

## Tech Stack

### Frontend

| Technology | Description |
|------------|-------------|
| **Next.js 14** | React framework with App Router for modern web applications |
| **TypeScript** | Type-safe JavaScript for better developer experience |
| **Tailwind CSS** | Utility-first CSS framework for responsive styling |
| **Framer Motion** | Smooth animations and transitions |
| **Lucide React** | Icon library |
| **Socket.io Client** | Real-time communication with backend |

### Backend

| Technology | Description |
|------------|-------------|
| **Node.js** | JavaScript runtime for server-side development |
| **Express** | Minimal and flexible Node.js web application framework |
| **TypeScript** | Type-safe JavaScript for backend |
| **PostgreSQL** | Relational database for persistent storage |
| **Prisma** | Next-generation ORM for type-safe database queries |
| **Socket.io** | Real-time bidirectional event-based communication |
| **JWT** | JSON Web Tokens for authentication |
| **Nodemailer** | Email sending service |
| **Twilio** | SMS and OTP services |

### Database Models

The system uses PostgreSQL with the following entities:
- **Patient** - Core patient data and authentication
- **Hospital** - Healthcare provider information
- **Doctor** - Medical professionals affiliated with hospitals
- **AccessRecord** - Active record access instances
- **ConsentRequest** - Pending/modified access requests
- **Notification** - Patient notifications
- **BlockedHospital** - Hospital access blacklist
- **OTP** - One-time password records
- **AuditLog** - Complete access audit trail

---

## Project Structure

```
medlink/
├── medlink-patient-app/          # Patient-facing frontend (Next.js)
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   │   ├── login/            # Login page
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── access/           # Access control
│   │   │   ├── consent/         # Consent management
│   │   │   ├── emergency/       # Emergency mode
│   │   │   ├── logs/            # Access logs
│   │   │   ├── notifications/   # Notification center
│   │   │   ├── profile/         # Patient profile
│   │   │   └── records/         # Medical records
│   │   ├── components/          # Reusable React components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility functions
│   │   └── types/               # TypeScript type definitions
│   └── public/                   # Static assets
│
├── medlink-backend/              # Core backend API (Node.js + Express)
│   ├── src/
│   │   ├── index.ts              # Express app entry point
│   │   ├── routes/               # API route handlers
│   │   │   ├── auth.ts          # Authentication routes
│   │   │   ├── patient.ts       # Patient data routes
│   │   │   ├── access.ts        # Access control routes
│   │   │   ├── consent.ts       # Consent request routes
│   │   │   └── notifications.ts # Notification routes
│   │   ├── services/             # Business logic services
│   │   │   ├── email.ts         # Email service (SMTP)
│   │   │   ├── sms.ts           # SMS/OTP service
│   │   │   ├── socket.ts        # Socket.io real-time service
│   │   │   └── auditLog.ts      # Audit logging service
│   │   ├── middleware/           # Express middleware
│   │   └── utils/                # Utility functions
│   └── prisma/
│       └── schema.prisma         # Database schema
│
├── prisma/                       # Shared database schema
└── README.md                     # This file
```

---

## Getting Started

Follow these instructions to set up and run MedLinkID locally for development and testing purposes.

### Prerequisites

Ensure you have the following installed on your system:

| Requirement | Version | Description |
|-------------|---------|-------------|
| **Node.js** | v18+ | JavaScript runtime |
| **PostgreSQL** | v14+ | Relational database |
| **npm** | v9+ | Package manager |
| **Git** | Latest | Version control |

### Database Setup

1. Install PostgreSQL if not already installed
2. Create a new database named `medlink`

```bash
# Example PostgreSQL setup (Linux/macOS)
sudo -u postgres psql
CREATE DATABASE medlink;
```

### Backend Setup

```bash
# Navigate to backend directory
cd medlink-backend

# Install dependencies
npm install

# Copy environment example file
cp .env.example .env

# Edit .env with your database URL and other secrets
# See Environment Variables section below

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start development server
npm run dev
```

The backend API runs on `http://localhost:3001`

### Frontend Setup

```bash
# Navigate to patient app directory
cd medlink-patient-app

# Install dependencies
npm install

# Copy environment example file
cp .env.example .env.local

# Edit .env.local with your configuration
# See Environment Variables section below

# Start development server
npm run dev
```

The frontend runs on `http://localhost:3000`

---

## Environment Variables

### Backend (.env)

Create a `.env` file in the `medlink-backend` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/medlink

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@medlink.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

Create a `.env.local` file in the `medlink-patient-app` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## API Endpoints

The backend provides RESTful APIs for all patient-facing functionality.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Patient login with patient ID |
| POST | `/api/auth/verify-otp` | Verify OTP and complete login |
| POST | `/api/auth/register` | Register new patient |
| POST | `/api/auth/forgot-password` | Request password reset |

### Patient Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patient/info` | Get patient profile information |
| PUT | `/api/patient/info` | Update patient profile |
| GET | `/api/patient/records` | Get patient's medical records |
| GET | `/api/patient/hospitals` | Get list of connected hospitals |
| GET | `/api/patient/profile` | Get full patient profile with medical info |

### Access Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/access/active` | Get all active access records |
| POST | `/api/access/approve` | Approve a consent request |
| POST | `/api/access/revoke` | Revoke active access |
| POST | `/api/access/extend` | Extend access duration |
| POST | `/api/access/block-hospital` | Block a hospital |
| DELETE | `/api/access/block-hospital/:hospitalId` | Unblock a hospital |
| GET | `/api/access/blocked-hospitals` | List all blocked hospitals |

### Consent Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/consent/requests` | Get pending consent requests |
| GET | `/api/consent/history` | Get consent request history |
| POST | `/api/consent/approve` | Approve consent request |
| POST | `/api/consent/reject` | Reject consent request |
| POST | `/api/consent/create` | Create new consent request |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get all notifications |
| PUT | `/api/notifications/:id/read` | Mark notification as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health status |

---

## Database Schema

The database schema is defined in Prisma and includes the following models:

### Patient Model

```prisma
model Patient {
  id              String   @id @default(uuid())
  patientId       String   @unique
  name            String
  phone           String   @unique
  email           String   @unique
  password        String
  bloodGroup      String?
  allergies       String   @default("[]")
  chronicDiseases String  @default("[]")
  emergencyContact String?
  guardianName     String?
  guardianMobile  String?
  guardianLocation String?
  fcmToken        String?
  profilePhoto   String?
  dateOfBirth     DateTime?
  gender          String?
  address         String?
}
```

### AccessRecord Model

Tracks active record access with expiry times:

```prisma
model AccessRecord {
  id              String   @id @default(uuid())
  patientId       String
  doctorId        String
  hospitalId      String
  accessStartTime DateTime @default(now())
  accessExpiryTime DateTime
  recordsViewed   String   @default("[]")
  status          String   @default("ACTIVE")
}
```

### ConsentRequest Model

Manages access requests from hospitals:

```prisma
model ConsentRequest {
  id                String   @id @default(uuid())
  patientId         String
  doctorId          String
  hospitalId        String
  recordsRequested  String   @default("[]")
  status            String   @default("PENDING")
  duration          Int      @default(24)
  requestTime       DateTime @default(now())
  responseTime      DateTime?
}
```

### AuditLog Model

Comprehensive logging of all actions:

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  patientId   String?
  doctorId    String?
  hospitalId  String?
  action      String
  description String
  metadata    String?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
}
```

For the complete schema, see `medlink-backend/prisma/schema.prisma`.

---

## New Features

This section highlights the key features added since the initial release.

### 1. Consent Management System

A complete consent request workflow that puts patients in control:

- Hospitals create consent requests specifying which records they need
- Patients receive notifications about pending requests
- Patients can approve with custom duration or reject with reason
- All consent actions are logged in the audit trail
- Consent history is maintained for future reference

### 2. Audit Logging Service

Every action on the platform is tracked for accountability:

- Record access (view, download)
- Consent requests (approve, reject, revoke)
- Profile updates
- Block/unblock hospital actions
- Login attempts
- IP address and user agent captured

### 3. Email Notification Service

Automated email communications:

- **Welcome Email** - Sent upon successful patient registration
- **Verification Email** - Email verification with secure token
- **Access Alerts** - Notification when records are accessed
- **Consent Updates** - Updates on consent request status

Uses nodemailer with support for any SMTP provider.

### 4. Guardian/Emergency Contact Support

Extended patient model to support emergency scenarios:

- Guardian name and mobile number
- Guardian location (optional)
- Emergency contact field
- All fields used for emergency access scenarios

### 5. Access Logs Page

Frontend interface to view complete access history:

- Timeline view of all record access
- Filter by hospital, doctor, date range
- Shows records accessed during each session
- Export capability for personal records

### 6. Real-Time Features

Socket.io integration for instant updates:

- Push notifications in real-time
- Live dashboard updates
- Instant consent request notifications
- Access expiry alerts

---

## Security

MedLinkID implements industry-standard security practices to protect patient data.

### Authentication

- **OTP-Based Login** - One-time passwords sent via SMS for secure authentication
- **JWT Tokens** - Short-lived JSON Web Tokens with configurable expiry
- **Password Hashing** - Secure password hashing (bcrypt)

### Data Protection

- **HTTPS Only** - All communications encrypted
- **Helmet.js** - Security headers middleware
- **CORS Protection** - Configured for specific origins only
- **Input Validation** - All inputs validated and sanitized

### Access Control

- **Consent First** - No automatic access; all access requires patient approval
- **Time-Limited Access** - All grants expire automatically
- **Instant Revocation** - Patients can revoke access immediately
- **Hospital Blocking** - Permanently block problematic hospitals

### Audit & Compliance

- **Complete Audit Trail** - Every action logged with timestamps
- **IP Tracking** - All access attempts tracked with IP address
- **Emergency Access Logging** - Critical events logged for compliance
- **Data Minimization** - Only essential data stored

### Best Practices

- Never commit secrets to version control
- Use strong JWT secrets in production
- Configure SMTP securely
- Enable database encryption
- Regular security audits recommended

---

## License

This project is built for secure, transparent healthcare interoperability.

Copyright © 2024 MedLinkID. All rights reserved.

---

## Support

For issues and feature requests, please open an issue on the project repository.

---

## Quick Reference

| Item | Value |
|------|-------|
| Frontend URL | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Database | PostgreSQL on port 5432 |
| Default JWT Expiry | 7 days |
| Default Access Duration | 24 hours |
