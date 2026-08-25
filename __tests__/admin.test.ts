import { createMocks } from "node-mocks-http";
import type { NextApiRequest, NextApiResponse } from "next";

// ─── Mock Firebase Admin ───
jest.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        get: jest.fn(() =>
          Promise.resolve({
            size: 2,
            docs: [
              {
                id: "design-1",
                ref: {
                  collection: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({ size: 3, docs: [] })),
                    orderBy: jest.fn(() => ({
                      get: jest.fn(() =>
                        Promise.resolve({ size: 3, docs: [] }),
                      ),
                      limit: jest.fn(() => ({
                        get: jest.fn(() => Promise.resolve({ docs: [] })),
                      })),
                    })),
                  })),
                  delete: jest.fn(() => Promise.resolve()),
                },
                data: () => ({
                  shareableId: "share-1",
                  name: "Design One",
                  imageUrl: "https://cloudinary.com/img1.jpg",
                  publicId: "taply/designs/img1",
                  creatorUid: "user-1",
                  createdAt: "2026-01-01T00:00:00.000Z",
                }),
              },
              {
                id: "design-2",
                ref: {
                  collection: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({ size: 1, docs: [] })),
                    orderBy: jest.fn(() => ({
                      get: jest.fn(() =>
                        Promise.resolve({ size: 1, docs: [] }),
                      ),
                      limit: jest.fn(() => ({
                        get: jest.fn(() => Promise.resolve({ docs: [] })),
                      })),
                    })),
                  })),
                  delete: jest.fn(() => Promise.resolve()),
                },
                data: () => ({
                  shareableId: "share-2",
                  name: "Design Two",
                  imageUrl: "https://cloudinary.com/img2.jpg",
                  publicId: "taply/designs/img2",
                  creatorUid: "user-2",
                  createdAt: "2026-01-02T00:00:00.000Z",
                }),
              },
            ],
          }),
        ),
      })),
      doc: jest.fn((id: string) => ({
        get: jest.fn(() =>
          Promise.resolve({
            exists: id !== "non-existent-id",
            id,
            ref: {
              collection: jest.fn(() => ({
                get: jest.fn(() => Promise.resolve({ size: 0, docs: [] })),
              })),
              delete: jest.fn(() => Promise.resolve()),
            },
            data: () => ({
              shareableId: "share-1",
              name: "Design One",
              imageUrl: "https://cloudinary.com/img1.jpg",
              publicId: "taply/designs/img1",
              creatorUid: "user-1",
              createdAt: "2026-01-01T00:00:00.000Z",
            }),
          }),
        ),
      })),
    })),
  },
  adminAuth: {
    verifyIdToken: jest.fn(),
    listUsers: jest.fn(() =>
      Promise.resolve({
        users: [
          {
            uid: "user-1",
            email: "admin@taply.com",
            displayName: "Admin User",
            customClaims: { admin: true },
            metadata: { creationTime: "2026-01-01T00:00:00.000Z" },
          },
        ],
      }),
    ),
    setCustomUserClaims: jest.fn(() => Promise.resolve()),
  },
}));

// ─── Mock Cloudinary ───
jest.mock("@/lib/cloudinary", () => ({
  deleteImage: jest.fn(() => Promise.resolve()),
}));

import statsHandler from "@/pages/api/admin/stats";
import designsHandler from "@/pages/api/admin/designs/index";
import designByIdHandler from "@/pages/api/admin/designs/[id]";
import { adminAuth } from "@/lib/firebase-admin";

// ─── Helper: mock admin token ───
function mockAdminToken() {
  (adminAuth.verifyIdToken as jest.Mock).mockResolvedValueOnce({
    uid: "admin-user-123",
    email: "admin@taply.com",
    admin: true,
  });
}

// ─── Helper: mock non-admin token ───
function mockNonAdminToken() {
  (adminAuth.verifyIdToken as jest.Mock).mockResolvedValueOnce({
    uid: "regular-user-123",
    email: "user@taply.com",
    admin: false,
  });
}

describe("Admin API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Stats Endpoint ───
  describe("GET /api/admin/stats", () => {
    it("should reject non-admin users with 401", async () => {
      mockNonAdminToken();

      const { req, res } = createMocks({
        method: "GET",
        headers: { authorization: "Bearer valid-non-admin-token" },
      });

      await statsHandler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("UNAUTHORIZED");
    });

    it("should reject requests without token with 401", async () => {
      const { req, res } = createMocks({ method: "GET" });

      await statsHandler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );

      expect(res._getStatusCode()).toBe(401);
    });

    it("should return stats for admin users", async () => {
      mockAdminToken();

      const { req, res } = createMocks({
        method: "GET",
        headers: { authorization: "Bearer admin-token" },
      });

      await statsHandler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty("totalDesigns");
      expect(data).toHaveProperty("totalFeedback");
      expect(data).toHaveProperty("totalUsers");
      expect(data).toHaveProperty("recentDesigns");
      expect(data).toHaveProperty("recentFeedback");
    });

    it("should reject GET with wrong method", async () => {
      const { req, res } = createMocks({ method: "POST" });

      await statsHandler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );

      expect(res._getStatusCode()).toBe(405);
    });
  });

  // ─── Designs List Endpoint ───
  describe("GET /api/admin/designs", () => {
    it("should reject non-admin with 401", async () => {
      mockNonAdminToken();

      const { req, res } = createMocks({
        method: "GET",
        headers: { authorization: "Bearer non-admin-token" },
      });

      await designsHandler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );

      expect(res._getStatusCode()).toBe(401);
    });

    it("should return list of designs for admin", async () => {
      mockAdminToken();

      const { req, res } = createMocks({
        method: "GET",
        headers: { authorization: "Bearer admin-token" },
      });

      await designsHandler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty("designs");
      expect(data).toHaveProperty("total");
      expect(Array.isArray(data.designs)).toBe(true);
    });
  });

  // ─── Delete Design Endpoint ───
  describe("DELETE /api/admin/designs/[id]", () => {
    it("should reject non-admin with 401", async () => {
      mockNonAdminToken();

      const { req, res } = createMocks({
        method: "DELETE",
        query: { id: "design-1" },
        headers: { authorization: "Bearer non-admin-token" },
      });

      await designByIdHandler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );

      expect(res._getStatusCode()).toBe(401);
    });

    it("should return 404 for non-existent design", async () => {
      mockAdminToken();

      const { req, res } = createMocks({
        method: "DELETE",
        query: { id: "non-existent-id" },
        headers: { authorization: "Bearer admin-token" },
      });

      await designByIdHandler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );

      expect(res._getStatusCode()).toBe(404);
    });

    it("should successfully delete existing design", async () => {
      mockAdminToken();

      const { req, res } = createMocks({
        method: "DELETE",
        query: { id: "design-1" },
        headers: { authorization: "Bearer admin-token" },
      });

      await designByIdHandler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
    });
  });
});
