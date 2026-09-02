import {
  BookOpenText,
  Building2,
  CalendarDays,
  CheckSquare2,
  ContactRound,
  FileText,
  LayoutDashboard,
  ListTodo,
  MoreHorizontal,
  FolderKanban,
  ScrollText,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Vue d’ensemble",
    items: [{ href: "/", label: "Aujourd’hui", icon: LayoutDashboard }],
  },
  {
    label: "Travail",
    items: [
      { href: "/projects", label: "Projets", icon: FolderKanban },
      { href: "/missions", label: "Missions", icon: ListTodo },
      { href: "/tasks", label: "Tâches", icon: CheckSquare2 },
    ],
  },
  {
    label: "Référentiel",
    items: [
      { href: "/organizations", label: "Organisations", icon: Building2 },
      { href: "/contacts", label: "Contacts", icon: ContactRound },
      { href: "/calendar", label: "Calendrier", icon: CalendarDays },
      { href: "/documents", label: "Documents", icon: FileText },
      { href: "/administration", label: "Administration", icon: ScrollText },
    ],
  },
  {
    label: "Plus",
    items: [
      { href: "/journal", label: "Journal", icon: BookOpenText },
      { href: "/settings", label: "Réglages", icon: Settings2 },
    ],
  },
];

export const mobileNavigation: NavigationItem[] = [
  { href: "/", label: "Accueil", icon: LayoutDashboard },
  { href: "/tasks", label: "Tâches", icon: CheckSquare2 },
  { href: "/calendar", label: "Calendrier", shortLabel: "Agenda", icon: CalendarDays },
  { href: "/documents", label: "Documents", shortLabel: "Docs", icon: FileText },
  { href: "/more", label: "Plus", icon: MoreHorizontal },
];

export const allNavigationItems = navigationGroups.flatMap((group) => group.items);
