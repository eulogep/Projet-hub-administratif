import { FileText } from "lucide-react";
import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export default function DocumentsPage() {
  return <ModulePlaceholder eyebrow="Référentiel" title="Documents" icon={FileText} description="Le stockage privé, les métadonnées et les téléchargements par URL signée seront implémentés après une revue de sécurité dédiée." />;
}

