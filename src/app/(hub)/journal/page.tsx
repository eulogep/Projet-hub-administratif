import { BookOpenText } from "lucide-react";
import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export default function JournalPage() {
  return <ModulePlaceholder eyebrow="Plus" title="Journal" icon={BookOpenText} description="Le journal professionnel guidé sera disponible dans un ticket séparé, après les missions et les contacts." />;
}

