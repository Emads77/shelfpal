import { useEffect, useState } from "react";
import { createBookcase, createShelves, getLibraryOverview } from "./api.js";
import { errorMessage } from "./errorMessage.js";

const STORAGE_KEY = "shelfpal.lastShelf";

function readLastShelf() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberShelf(shelfId) {
  try {
    if (shelfId === null || shelfId === undefined) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(shelfId));
    }
  } catch {}
}

function hasShelf(bookcases, shelfId) {
  return bookcases.some((b) => b.shelves.some((s) => String(s.id) === shelfId));
}

export function useShelfPicker() {
  const [bookcases, setBookcases] = useState([]);
  const [shelf, setShelf] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getLibraryOverview()
      .then((overview) => {
        if (cancelled) return;
        setBookcases(overview.bookcases);
        const last = readLastShelf();
        setShelf((current) =>
          current === "" && last && hasShelf(overview.bookcases, last)
            ? last
            : current,
        );
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function pathFor(shelfId) {
    if (shelfId === null) return "/bookcases/unassigned";
    const bookcase = bookcases.find((b) =>
      b.shelves.some((s) => s.id === shelfId),
    );
    return bookcase
      ? `/bookcases/${bookcase.id}/shelves/${shelfId}`
      : "/bookcases";
  }

  async function addBookcase(name) {
    const created = await createBookcase(name);
    const bookcase = { id: created.id, name: created.name, shelves: [] };
    setBookcases((current) => [...current, bookcase]);
    return bookcase;
  }

  async function addShelf(bookcaseId, name) {
    const [created] = await createShelves(bookcaseId, [name]);
    setBookcases((current) =>
      current.map((b) =>
        b.id === bookcaseId
          ? {
              ...b,
              shelves: [...b.shelves, { id: created.id, name: created.name }],
            }
          : b,
      ),
    );
    setShelf(String(created.id));
    return created;
  }

  return {
    bookcases,
    shelf,
    setShelf,
    loadError,
    pathFor,
    addBookcase,
    addShelf,
  };
}
