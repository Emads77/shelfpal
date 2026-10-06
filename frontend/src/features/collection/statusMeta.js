import { BookOpen, Check, Circle } from "lucide-react";

export const STATUS_META = {
  unread: { label: "Unread", icon: Circle, variant: "outline" },
  reading: { label: "Reading", icon: BookOpen, variant: "solid" },
  finished: { label: "Finished", icon: Check, variant: "soft" },
};

export const STATUS_ORDER = ["unread", "reading", "finished"];
