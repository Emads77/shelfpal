import "./empty-state.css"

export default function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="card empty-state">
      {Icon && <Icon className="empty-state__icon" size={32} aria-hidden="true" />}
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__text">{children}</p>
      {action}
    </div>
  );
}
