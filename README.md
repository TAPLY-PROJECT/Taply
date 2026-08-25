# Taply

A modern design feedback platform built with **Next.js** that enables designers to upload designs, share them with clients, and collect contextual visual feedback through interactive comment markers.

![Status](https://img.shields.io/badge/status-MVP-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

# Overview

Taply streamlines the design review process by allowing designers to upload images, generate shareable review links, and receive visual feedback directly on the design canvas.

### MVP Workflow

```text
Upload Design
      │
      ▼
Generate Share Link
      │
      ▼
Client Opens Review Page
      │
      ▼
Click Anywhere on Design
      │
      ▼
Leave Feedback
      │
      ▼
Designer Views Feedback Pins
```

---

# Features

## Design Upload

- Upload image designs
- Secure image storage with Cloudinary
- Upload progress indicator
- Automatic shareable review link generation

## Public Review Page

- Public review links
- Dynamic routing
- Responsive design canvas
- Display all submitted feedback

## Interactive Feedback

- Click anywhere on the design
- Capture normalized X/Y coordinates
- Feedback modal
- Submit contextual comments

## Feedback Visualization

- Visual feedback pins
- Coordinate-based positioning
- Automatic refresh after submission

## Security

- Firebase Authentication
- Firestore Security Rules
- Cloudinary upload verification
- API rate limiting
- Input validation with Zod

## User Experience

- Responsive layout
- Loading states
- Empty states
- Error handling
- Snackbar notifications

---

# Tech Stack

| Category         | Technology              |
| ---------------- | ----------------------- |
| Framework        | Next.js 15 (App Router) |
| Language         | TypeScript              |
| UI               | tailwindcss             |
| State Management | Zustand                 |
| Data Fetching    | SWR                     |
| Forms            | React Hook Form         |
| Validation       | Zod                     |
| Authentication   | Firebase Authentication |
| Database         | Firebase Firestore      |
| Image Storage    | Cloudinary              |
| Testing          | Jest                    |
| Deployment       | Vercel                  |

---

# Project Structure

```text
taply/
│
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── review/
│   │       └── [shareableId]/
│   │
│   ├── pages/
│   │   └── api/
│   │       ├── designs/
│   │       └── feedback/
│   │
│   ├── components/
│   │
│   ├── hooks/
│   │
│   ├── services/
│   │
│   ├── store/
│   │
│   ├── lib/
│   │
│   ├── types/
│   │
│   └── utils/
│
├── public/
│
├── tests/
│
├── docs/
│
├── .env.local
│
└── README.md
```

---

# Routes

## Home

```text
/
```

Responsibilities

- Upload designs
- Generate review links

---

## Review

```text
/review/[shareableId]
```

Responsibilities

- Display uploaded design
- View existing feedback
- Submit new feedback

Example

```text
/review/clx8af2s9
```

---

# API Endpoints

## Upload Design

```http
POST /api/designs
```

Uploads a design and returns a unique shareable link.

---

## Get Design

```http
GET /api/designs/[shareableId]
```

Returns

- Design information
- Feedback list

---

## Submit Feedback

```http
POST /api/feedback
```

Creates a new feedback comment at the selected coordinates.

---

# State Management

## SWR

Used for

- Fetching designs
- Fetching feedback
- Cache management
- Automatic revalidation

## Zustand

Used for global UI state

Examples

- Feedback modal
- Loading states
- Selected marker

## React Hook Form + Zod

Used for

- Upload form
- Feedback form
- Validation

---

# UI Components

Tailwind CSS is used throughout the application for styling.

Examples include

- Custom Button components
- Modal & Dialog
- Form inputs
- Loading skeletons
- Alert notifications
- Responsive layouts
- Icon components (Tabler Icons)

---

# Security

The backend includes multiple security layers.

- Firebase Authentication
- Firestore Security Rules
- Cloudinary upload verification
- Rate limiting
- Server-side validation
- Protected write operations

---

# Environment Variables

Create a `.env.local` file.

```env
# Firebase Admin

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Firebase Client

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Cloudinary

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# API

NEXT_PUBLIC_API_URL=
```

---

# Getting Started

## Clone Repository

```bash
git clone https://github.com/Mlue-Code/-Taply.git
```

```bash
cd taply
```

---

## Install Dependencies

```bash
npm install
```

---

## Run Development Server

```bash
npm run dev
```

Open

```text
http://localhost:3000
```

---

# Testing

Run all tests

```bash
npm test
```

Run tests in watch mode

```bash
npm run test:watch
```

---

# Deployment

Taply is deployed using **Vercel**.

Deployment flow

```text
GitHub
   │
   ▼
Vercel
   │
   ▼
Automatic Deployment
```

---

# MVP Scope

Included

- ✅ Design Upload
- ✅ Shareable Review Links
- ✅ Public Review Page
- ✅ Interactive Feedback
- ✅ Feedback Pins
- ✅ Responsive UI
- ✅ Firebase Authentication
- ✅ Cloudinary Image Storage
- ✅ Firestore Database
- ✅ Security Hardening

Future Enhancements

- User dashboard
- Multiple projects
- Team collaboration
- Rich text comments
- Email notifications
- Design version history

---

# Team Collaboration

Frontend and backend developers collaborate through

- Shared API contracts
- Shared TypeScript types
- Common validation schemas
- Pull requests and code reviews
- GitHub Issues and Projects

---

# License

This project is developed as the MVP version of Taply for educational and demonstration purposes.

---

# Acknowledgements

Special thanks to the teams behind

- Next.js
- React
- TypeScript
- Material UI
- Firebase
- Cloudinary
- Vercel

# Author

- Homafar Sharifi (Team Leader | UI/UX designer)
- Somaiya Noori (Backend developer)
- Satayesh Esmaily (Frontend developer)
