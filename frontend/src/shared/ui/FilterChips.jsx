import "./filter-chips.css"

export default function FilterChips({label, options, value, onChange}) {
  return (
    <div role="group" aria-label={label} className="filter-chips">
      {options.map((option) => (
        <button
        key={option.value}
        type="button"
        className="filter-chip"
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        >
          {option.label}
          {typeof option.count === "number" && (
            <span className="filter-chip__count">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
