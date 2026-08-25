import { createMocks } from "node-mocks-http";
import type { NextApiRequest, NextApiResponse } from "next";

jest.mock("@paralleldrive/cuid2", () => ({
  createId: jest.fn(() => "mock-shareable-id-xyz789"),
}));

// ─── Mock Firebase Admin ───
jest.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: jest.fn(() => ({
      add: jest.fn(() => Promise.resolve({ id: "mock-design-id-123" })),
    })),
  },
  adminAuth: {
    verifyIdToken: jest.fn(),
  },
}));

// ─── Mock Cloudinary ───
jest.mock("@/lib/cloudinary", () => ({
  uploadImage: jest.fn(() =>
    Promise.resolve({
      url: "https://res.cloudinary.com/test/image.jpg",
      publicId: "taply/designs/test123",
    }),
  ),
}));

// ─── Mock parse-form ───
jest.mock("@/lib/parse-form", () => ({
  parseFormFile: jest.fn(),
}));

import handler from "@/pages/api/designs";
import { adminAuth } from "@/lib/firebase-admin";
import { parseFormFile } from "@/lib/parse-form";
import { resetRateLimitStore } from "@/lib/rate-limit";

describe("POST /api/designs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimitStore();
  });

  // ─── HTTP Method Tests ───
  describe("HTTP Method Validation", () => {
    it("should reject GET requests with 405", async () => {
      const { req, res } = createMocks({ method: "GET" });
      await handler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );
      expect(res._getStatusCode()).toBe(405);
    });

    it("should reject PUT requests with 405", async () => {
      const { req, res } = createMocks({ method: "PUT" });
      await handler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );
      expect(res._getStatusCode()).toBe(405);
    });

    it("should reject DELETE requests with 405", async () => {
      const { req, res } = createMocks({ method: "DELETE" });
      await handler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );
      expect(res._getStatusCode()).toBe(405);
    });
  });

  // ─── Authentication Tests ───
  describe("Authentication", () => {
    it("should reject requests without authorization header", async () => {
      const { req, res } = createMocks({ method: "POST" });
      await handler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );
      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("UNAUTHORIZED");
    });

    it("should reject requests with invalid auth format", async () => {
      const { req, res } = createMocks({
        method: "POST",
        headers: { authorization: "InvalidFormat token123" },
      });
      await handler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );
      expect(res._getStatusCode()).toBe(401);
    });

    it("should reject requests with invalid token", async () => {
      (adminAuth.verifyIdToken as jest.Mock).mockRejectedValueOnce(
        new Error("Invalid token"),
      );
      const { req, res } = createMocks({
        method: "POST",
        headers: { authorization: "Bearer invalid-token" },
      });
      await handler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );
      expect(res._getStatusCode()).toBe(401);
    });
  });

  // ─── File Validation Tests ───
  describe("File Validation", () => {
    it("should reject requests without a file", async () => {
      (adminAuth.verifyIdToken as jest.Mock).mockResolvedValueOnce({
        uid: "test-user-123",
        email: "test@taply.com",
      });
      (parseFormFile as jest.Mock).mockRejectedValueOnce(
        new Error('No image file provided. Use field name "image"'),
      );
      const { req, res } = createMocks({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
      });
      await handler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );
      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("VALIDATION_ERROR");
    });

    it("should reject non-image files", async () => {
      (adminAuth.verifyIdToken as jest.Mock).mockResolvedValueOnce({
        uid: "test-user-123",
        email: "test@taply.com",
      });
      (parseFormFile as jest.Mock).mockRejectedValueOnce(
        new Error("Only image files are allowed"),
      );
      const { req, res } = createMocks({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
      });
      await handler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );
      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("VALIDATION_ERROR");
    });
  });

  // ─── Success Tests ───
  describe("Successful Upload", () => {
    it("should successfully upload a valid image with name", async () => {
      (adminAuth.verifyIdToken as jest.Mock).mockResolvedValueOnce({
        uid: "test-user-123",
        email: "test@taply.com",
      });

      (parseFormFile as jest.Mock).mockResolvedValueOnce({
        file: {
          buffer: Buffer.from("fake-image-data"),
          mimeType: "image/jpeg",
          fileName: "test.jpg",
          size: 1024,
        },
        fields: {
          name: "My Homepage Design",
        },
      });

      const { req, res } = createMocks({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );

      expect(res._getStatusCode()).toBe(201);

      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("shareableId");
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("imageUrl");
      expect(data).toHaveProperty("createdAt");

      expect(data.id).toBe("mock-design-id-123");
      expect(data.shareableId).toBe("mock-shareable-id-xyz789");
      expect(data.name).toBe("My Homepage Design");
      expect(data.imageUrl).toBe("https://res.cloudinary.com/test/image.jpg");
    });

    it("should use filename as name when no name field is provided", async () => {
      (adminAuth.verifyIdToken as jest.Mock).mockResolvedValueOnce({
        uid: "test-user-123",
        email: "test@taply.com",
      });

      // ← No name in fields
      (parseFormFile as jest.Mock).mockResolvedValueOnce({
        file: {
          buffer: Buffer.from("fake-image-data"),
          mimeType: "image/jpeg",
          fileName: "homepage.jpg",
          size: 1024,
        },
        fields: {},
      });

      const { req, res } = createMocks({
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
      });

      await handler(
        req as unknown as NextApiRequest,
        res as unknown as NextApiResponse,
      );

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      // Should use filename without extension as fallback
      expect(data.name).toBe("homepage");
    });
  });
});
