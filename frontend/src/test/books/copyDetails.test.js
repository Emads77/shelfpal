import { describe, expect, it } from "vitest";
import {
  EMPTY_DETAILS,
  validateDetails,
} from "../../features/books/copyDetails.js";

const numbered = (editionNumber, editionSize = "") => ({
  ...EMPTY_DETAILS,
  isNumbered: true,
  editionNumber,
  editionSize,
});

describe("US-03: validating the signed and numbered fields", () => {
  it("CT-28 requires a number for a numbered copy", () => {
    expect(validateDetails(numbered(""))).toEqual({
      edition_number: ["Enter the number of your copy."],
    });
    expect(validateDetails(numbered("   "))).toEqual({
      edition_number: ["Enter the number of your copy."],
    });
  });

  it("CT-28 rejects a number higher than the edition size", () => {
    expect(validateDetails(numbered("101", "100"))).toEqual({
      edition_number: ["The number cannot be higher than the edition size."],
    });
  });

  it("CT-28 accepts a valid number with or without an edition size, and ignores the numbers when the copy is not numbered", () => {
    expect(validateDetails(numbered("5", "100"))).toEqual({});
    expect(validateDetails(numbered("5"))).toEqual({});
    expect(
      validateDetails({
        ...EMPTY_DETAILS,
        isNumbered: false,
        editionNumber: "x",
      }),
    ).toEqual({});
  });
});
