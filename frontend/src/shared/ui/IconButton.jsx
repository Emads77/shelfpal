import "./icon-button.css";

export default function IconButton({
  label,
  type = "button",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`icon-button ${className}`.trim()}
      {...props}
      >
      {children}
    </button>
  );
}
