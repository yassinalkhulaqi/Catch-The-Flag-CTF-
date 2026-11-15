import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { errorMessage, errorRequestId, fieldError } from "@/lib/errors";

describe("errorMessage", () => {
  it("returns the API error message", () => {
    const error = new ApiError(422, {
      code: "validation_failed",
      message: "The given data was invalid.",
    });

    expect(errorMessage(error)).toBe("The given data was invalid.");
  });

  it("appends the server request id as a reference when present", () => {
    const error = new ApiError(429, {
      code: "rate_limited",
      message: "Too many requests.",
      request_id: "abc-123",
    });

    expect(errorMessage(error)).toBe("Too many requests. (ref: abc-123)");
  });

  it("falls back to the fallback message for unknown failures", () => {
    expect(errorMessage(null, "Nope.")).toBe("Nope.");
    expect(errorMessage("string error", "Nope.")).toBe("Nope.");
  });

  it("returns the message of a plain Error without a reference", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
  });
});

describe("errorRequestId", () => {
  it("extracts the id from an ApiError", () => {
    const error = new ApiError(500, {
      code: "server_error",
      message: "Something went wrong.",
      request_id: "req-1",
    });

    expect(errorRequestId(error)).toBe("req-1");
  });

  it("returns null for a plain Error", () => {
    expect(errorRequestId(new Error("boom"))).toBeNull();
    expect(errorRequestId(null)).toBeNull();
  });
});

describe("fieldError", () => {
  it("returns the first error for the requested field", () => {
    const error = new ApiError(422, {
      code: "validation_failed",
      message: "The given data was invalid.",
      fields: { email: ["The email field is required."] },
    });

    expect(fieldError(error, "email")).toBe("The email field is required.");
    expect(fieldError(error, "name")).toBeUndefined();
  });
});
