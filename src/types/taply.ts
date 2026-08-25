// This file is shared between the backend and frontend.
// Frontend developers rely on these types throughout the application.
// Any changes made here may affect both the frontend and backend.

// Core database models

export interface Design {
  id: string;
  shareableId: string;
  name: string;
  imageUrl: string;
  publicId: string;
  creatorUid: string;
  createdAt: string;
}
export interface Feedback {
  id: string;
  comment: string;
  x: number;
  y: number;
  createdAt: string;
  status?: FeedbackStatus;
}

export type FeedbackStatus = "positive" | "needs_change" | "resolved";

// API response formats
// Frontend developers use these interfaces to handle API responses.

export interface UploadDesignResponse {
  id: string;
  shareableId: string;
  name: string;
  imageUrl: string;
  createdAt: string;
}

export interface GetDesignResponse {
  design: Design;
  feedback: Feedback[];
}

export interface CreateFeedbackResponse {
  id: string;
  comment: string;
  x: number;
  y: number;
  createdAt: string;
  status: FeedbackStatus;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  error: ApiErrorCode;
  message: string;
}

export interface CreateFeedbackRequest {
  designId: string;
  comment: string;
  x: number;
  y: number;
}
// ─── Admin Types ───

export interface AdminDesign {
  id: string;
  shareableId: string;
  name: string;
  imageUrl: string;
  publicId: string;
  creatorUid: string;
  createdAt: string;
  feedbackCount: number;
}

export interface AdminFeedback {
  id: string;
  designId: string;
  comment: string;
  x: number;
  y: number;
  createdAt: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: string;
  designCount: number;
}

export interface AdminStats {
  totalDesigns: number;
  totalFeedback: number;
  totalUsers: number;
  recentDesigns: AdminDesign[];
  recentFeedback: AdminFeedback[];
}

export interface MakeAdminRequest {
  uid: string;
}

export interface MakeAdminResponse {
  success: boolean;
  message: string;
  uid: string;
}
