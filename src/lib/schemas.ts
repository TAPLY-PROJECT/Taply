import { z } from "zod";

export const CreateFeedbackSchema = z.object({
  designId: z.string().trim().min(1, "designId cannot be empty"),
  comment: z.string().trim().min(1, "comment cannot be empty").max(500, "comment must be 500 characters or less"),
  x: z.number().min(0, "x must be between 0 and 1").max(1, "x must be between 0 and 1"),
  y: z.number().min(0, "y must be between 0 and 1").max(1, "y must be between 0 and 1"),
  status: z.enum(["positive", "needs_change"]).default("needs_change"),
});

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>;

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

/**
 * Validates feedback data.
 *
 * @param data - Raw data received from the request.
 * @returns Validation result indicating success or any validation errors.

 */
export function validateFeedback(
  data: unknown,
): ValidationResult<CreateFeedbackInput> {
  const result = CreateFeedbackSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const errors = result.error.issues.map((issue) => {
    const field = issue.path.join(".");
    return field ? `${field}: ${issue.message}` : issue.message;
  });

  return {
    success: false,
    errors,
  };
}
