import { useId } from "react";
import { Search } from "lucide-react";
import "./search-field.css";

export default function SearchField({
  label,
  value,
  onChange,
  placeHolder,
  endAction,
  ...inputProps
}) {
  const id = useId();

  return (
    <div
      className={`search-field ${endAction ? "search-field--with-action" : ""}`.trim()}
      >
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <Search className="search-field__icon" size={20} aria-hidden="true" />
      <input
        id={id}
        type="search"
        className="search-field__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeHolder}
        autoComplete="off"
        {...inputProps}
        />
      {endAction && <div className="search-field__end">{endAction}</div>}
    </div>
  );
}
