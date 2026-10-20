import { BookOpen, Dices, Library } from "lucide-react";

export const navItems = [
  { to: "/", label: "Collection", icon: BookOpen, end: true },
  { to: "/bookcases", label: "Bookcases", icon: Library },
  { to: "/picker", label: "Picker", icon: Dices },
];
