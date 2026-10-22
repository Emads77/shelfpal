export const EMPTY_DETAILS = {
  isSigned: false,
  isNumbered: false,
  editionNumber: "",
  editionSize: "",
};

function toPositiveInt(text) {
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return value >= 1 ? value : null;
}

export function validateDetails(details) {
  const errors = {};
  if (!details.isNumbered) return errors;

  const numberText = details.editionNumber.trim();
  const sizeText = details.editionSize.trim();
  const number = toPositiveInt(numberText);
  const size = sizeText ? toPositiveInt(sizeText) : undefined;

  if (!numberText) {
    errors.edition_number = ["Enter the number of your copy."];
  } else if (number === null) {
    errors.edition_number = ["Enter a whole number, 1 or higher."];
  }
  if (size === null) {
    errors.edition_size = ["Enter a whole number, 1 or higher."];
  }
  if (!errors.edition_number && size && number > size) {
    errors.edition_number = [
      "The number cannot be higher than the edition size.",
    ];
  }
  return errors;
}

export function detailsPayload(details) {
  const numbered = details.isNumbered;
  const sizeText = details.editionSize.trim();
  return {
    is_signed: details.isSigned,
    edition_number: numbered ? Number(details.editionNumber.trim()) : null,
    edition_size: numbered && sizeText ? Number(sizeText) : null,
  };
}

export function detailsFromCopy(copy) {
  const numbered = copy.edition_number !== null;
  return {
    isSigned: copy.is_signed,
    isNumbered: numbered,
    editionNumber: numbered ? String(copy.edition_number) : "",
    editionSize: copy.edition_size === null ? "" : String(copy.edition_size),
  };
}
