import { useEffect, useId, useRef, useState } from "react";
import { ChevronUp, Menu } from "lucide-react";
import Button from "../shared/ui/Button.jsx";
import { useAuth } from "../state/useAuth.js";
import "./AccountMenu.css";

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logout();
  }

  const initial = user.username.charAt(0).toUpperCase();

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="account-menu__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="visually-hidden">Account menu: </span>
        <Menu className="account-menu__menu-icon" aria-hidden="true" />
        <span className="account-menu__avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="account-menu__name">{user.username}</span>
        <ChevronUp
          className="account-menu__chevron"
          size={18}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={panelId} className="account-menu__panel">
          <p className="account-menu__who">
            Signed in as <strong>{user.username}</strong>
          </p>
          <Button
            variant="secondary"
            className="account-menu__logout"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </div>
      )}
    </div>
  );
}
