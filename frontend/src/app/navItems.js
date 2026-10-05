import { BookOpen, Dices, Library } from "lucide-react";

export const navItems = [
  { to: "/", label: "Collection", icon: BookOpen, end: true },
  { to: "/shelves", label: "Shelves", icon: Library },
  { to: "/picker", label: "Picker", icon: Dices },
];
