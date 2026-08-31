import { Settings2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export default function SettingsPage() {
  return <ModulePlaceholder eyebrow="Plus" title="Réglages" icon={Settings2} description="Les préférences personnelles seront ajoutées uniquement lorsqu’un besoin concret les justifiera." />;
}

