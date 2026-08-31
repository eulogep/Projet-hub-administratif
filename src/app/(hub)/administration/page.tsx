import { ScrollText } from "lucide-react";
import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export default function AdministrationPage() {
  return <ModulePlaceholder eyebrow="Suivi" title="Administration" icon={ScrollText} description="Les contrats et démarches administratives seront ajoutés après les organisations et les documents privés." />;
}

