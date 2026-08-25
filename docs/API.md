# Taply API Documentation

> **Version:** 1.0.0
> **Base URL (Dev):** `http://localhost:3000`
> **Base URL (Prod):** `https://taply.vercel.app` _(coming soon)_

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Format](#error-format)
3. [Endpoints](#endpoints)
   - [POST /api/designs](#post-apidesigns)
   - [POST /api/feedback](#post-apifeedback)
   - [GET /api/designs/[shareableId]](#get-apidesignsshareableid)
4. [Code Examples](#code-examples)
5. [Common Errors](#common-errors)

---

## Authentication

Authenticated endpoints require a Firebase ID token.

### How to Get a Token

```typescript
import { getAuth } from "firebase/auth";

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const token = await user.getIdToken();
}
```

### Header Format

```http
Authorization: Bearer <firebase-id-token>
```

> Important: the word `Bearer` followed by a space before the token is required.

---

## Error Format

All API errors follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Error Codes

| Code               | Description                             |
| ------------------ | --------------------------------------- |
| `UNAUTHORIZED`     | Missing or invalid authentication token |
| `VALIDATION_ERROR` | Invalid request data                    |
| `NOT_FOUND`        | Resource not found                      |
| `FORBIDDEN`        | Access denied                           |
| `INTERNAL_ERROR`   | Internal server error                   |

---

## Endpoints

### POST /api/designs

Upload a new design and receive a shareable link.

#### Authentication

**Required**

#### Request

**URL:** `POST /api/designs`

**Headers:**

| Header          | Value                 | Required                               |
| --------------- | --------------------- | -------------------------------------- |
| `Authorization` | `Bearer <token>`      | Yes                                    |
| `Content-Type`  | `multipart/form-data` | Yes (automatically set by the browser) |

**Body (form-data):**

| Field   | Type | Required | Description             |
| ------- | ---- | -------- | ----------------------- |
| `image` | File | Yes      | Design image (max 10MB) |

#### Response

**Success - 201 Created**

```json
{
  "id": "abc123xyz",
  "shareableId": "ckpqr5w8x000abc",
  "imageUrl": "https://res.cloudinary.com/taply/image/upload/v1234/taply/designs/abc.jpg",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

---

### POST /api/feedback

Submit feedback on a design at specific coordinates.

#### Authentication

**Not Required** (Public endpoint)

#### Request

**URL:** `POST /api/feedback`

**Headers:**

| Header         | Value              | Required |
| -------------- | ------------------ | -------- |
| `Content-Type` | `application/json` | Yes      |

**Body (JSON):**

| Field      | Type   | Required | Constraints     | Description                            |
| ---------- | ------ | -------- | --------------- | -------------------------------------- |
| `designId` | string | Yes      | Non-empty       | The ID of the design to leave feedback |
| `comment`  | string | Yes      | 1-500 chars     | The feedback text                      |
| `x`        | number | Yes      | Between 0 and 1 | Horizontal coordinate (relative)       |
| `y`        | number | Yes      | Between 0 and 1 | Vertical coordinate (relative)         |

#### Response

**Success - 201 Created**

```json
{
  "id": "ckpqr5w8x000abc",
  "comment": "Looking great! Maybe try a brighter color here.",
  "x": 0.45,
  "y": 0.78,
  "createdAt": "2025-01-15T12:30:00.000Z"
}
```

---

### GET /api/designs/[shareableId]

Retrieve a design along with all its feedback by shareable ID.

#### Authentication

**Not Required** (Public endpoint)

#### Request

**URL:** `GET /api/designs/[shareableId]`

**Path parameters:**

| Parameter     | Type   | Required | Description                           |
| ------------- | ------ | -------- | ------------------------------------- |
| `shareableId` | string | Yes      | The public shareable ID of the design |

#### Response

**Success - 200 OK**

```json
{
  "design": {
    "id": "abc123xyz",
    "shareableId": "ckpqr5w8x000abc",
    "imageUrl": "https://res.cloudinary.com/taply/image/upload/v1234/design.jpg",
    "publicId": "taply/designs/abc",
    "creatorUid": "user-uid-123",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "feedback": []
}
```

---

## Code Examples

### Upload Design (TypeScript + Fetch)

```typescript
import { getAuth } from "firebase/auth";

async function uploadDesign(file: File) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  const token = await user.getIdToken();
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/designs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
}
```

### Submit Feedback (TypeScript + Fetch)

```typescript
async function submitFeedback(data: {
  designId: string;
  comment: string;
  x: number;
  y: number;
}) {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}
```

### Fetch Design with Feedback (TypeScript + Fetch)

```typescript
async function fetchDesign(shareableId: string) {
  const response = await fetch(`/api/designs/${shareableId}`);
  return response.json();
}
```

### cURL (Terminal Testing)

```bash
curl http://localhost:3000/api/designs/ckpqr5w8x000abc
```

---

## Common Errors & Solutions

- "Authorization header missing"
  - Cause: No Firebase token was sent.
  - Solution: Send `Authorization: Bearer <token>`.

- "comment cannot be empty"
  - Cause: The comment field is empty.
  - Solution: Use a non-empty comment.

- "x must be between 0 and 1"
  - Cause: Coordinates are outside the allowed range.
  - Solution: Use normalized coordinates between 0 and 1.

---

Last Updated: June 2026

Backend Developer: Somaiya Noori
