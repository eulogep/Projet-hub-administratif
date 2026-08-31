import { ListTodo } from "lucide-react";
import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export default function MissionsPage() {
  return <ModulePlaceholder eyebrow="Travail" title="Missions" icon={ListTodo} description="Le suivi des missions sera activé avec son modèle de données et ses règles de statut dans un ticket dédié." />;
}

