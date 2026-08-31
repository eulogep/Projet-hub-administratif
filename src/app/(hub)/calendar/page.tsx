import { CalendarDays } from "lucide-react";
import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export default function CalendarPage() {
  return <ModulePlaceholder eyebrow="Planification" title="Calendrier" icon={CalendarDays} description="Les événements internes et les conflits horaires seront disponibles dans un ticket ultérieur, sans synchronisation externe en V1." />;
}

