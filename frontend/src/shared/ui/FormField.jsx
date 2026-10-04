export default function FormField({
  id,
  label,
  errors,
  type = "text",
  ...inputProps
}) {
  const errorId = `${id}-error`;
  const hasError = Boolean(errors?.length);

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        {...inputProps}
      />
      {hasError && (
        <p id={errorId} className="field-error">
          {errors.join(" ")}
        </p>
      )}
    </>
  );
}
