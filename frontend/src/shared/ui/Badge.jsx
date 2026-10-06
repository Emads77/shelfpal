import "./badge.css";

export default function Badge({ variant = "neutral", icon: Icon, children }) {
  return (
    <span className={`badge badge--${variant}`}>
      {Icon && <Icon size={14} aria-hidden="true" />}
      {children}
    </span>
  );
}
