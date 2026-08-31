# 5. Architecture technique

Évaluation datée du 31 août 2026. Les tarifs sont indicatifs, hors taxes et à revérifier avant engagement.

## Options comparées

| Critère | A. Next.js + Supabase + n8n | B. Notion + Make + Google Calendar | C. Hybride |
|---|---|---|---|
| Mise en route | Moyenne : conception et développement nécessaires | Très rapide : bases et vues no-code | Rapide au départ, puis intégration à gérer |
| Coût initial | Hébergement possible à faible coût; Supabase Free pour prototype; Pro actuellement à 25 $/mois; n8n différé | Notion Free personnel; Plus annoncé à 10 $/membre/mois; Make Free puis Core annoncé à 12 $/mois pour 10k crédits | Cumul possible des abonnements et du développement |
| Coût caché | Temps de développement, tests, sécurité et maintenance | Crédits Make, limites d’API/fichiers, duplication et migrations | Synchronisation, conflits, observabilité et double modèle de données |
| Modèle métier | Fort : contraintes, relations, calculs, requêtes temporelles | Correct pour listes simples, moins robuste pour invariants et time tracking | Fort si une seule source de vérité est imposée |
| Sécurité | RLS, Auth, Storage privé; dépend de la qualité des politiques | Permissions gérées par les fournisseurs, contrôle fin et export moins homogènes | Surface d’attaque et nombre de secrets plus élevés |
| Évolutivité | Très bonne, API et schéma contrôlés | Bonne pour usage léger; dette lorsque les workflows deviennent structurés | Bonne mais complexité de synchronisation croissante |
| Automatisation | n8n puissant, webhooks/API, déploiement séparé | Make très rapide à configurer | Flexible mais responsabilités ambiguës |
| Portabilité | PostgreSQL + exports fichiers, élevée | Exports disponibles mais relations/automatisations moins portables | Dépend du stockage maître |
| Maintenance | Migrations, monitoring et mises à jour à assumer | Faible côté infrastructure | La plus élevée des trois |

Sources tarifaires actuelles : [Supabase](https://supabase.com/pricing), [Notion](https://www.notion.com/pricing), [Make](https://www.make.com/en/pricing), [n8n](https://n8n.io/pricing/). n8n Cloud Starter est actuellement annoncé à 20 €/mois facturé annuellement pour 2 500 exécutions; il n’est pas nécessaire au MVP.

## Décision

Retenir **A. Next.js + Supabase**, avec **n8n uniquement en phase 2**.

Ce choix coûte davantage en conception mais répond aux exigences structurantes : documents privés, relations cohérentes, calculs d’heures, recherche transversale, pipelines, export et séparation stricte des comptes. Notion + Make est excellent pour un prototype jetable, mais deviendrait ici la base officielle de données personnelles hétérogènes et multiplierait les conventions implicites. L’hybride créerait deux sources de vérité avant même que les usages soient stabilisés.

## Architecture cible

```text
Navigateur mobile / bureau
          │ HTTPS
          ▼
Next.js (UI + serveur/BFF)
   │             │
   │ session     │ actions privilégiées validées
   ▼             ▼
Supabase Auth ─ PostgreSQL (RLS)
                    │
                    ├── Supabase Storage privé
                    ├── jobs/rappels déterministes
                    └── journal d’audit

Phase 2 seulement:
n8n ── OAuth Google ── Gmail / Calendar
 │
 └── API serveur limitée du Hub, idempotente et auditée
```

## Composants

- Frontend : Next.js avec App Router, TypeScript strict, rendu serveur lorsque pertinent, Tailwind CSS et primitives accessibles de type shadcn/ui.
- Accès données : client Supabase avec clé publiable et RLS pour opérations utilisateur; actions serveur pour exports, webhooks, OAuth et traitements privilégiés.
- Validation : schémas partagés côté client/serveur, contraintes PostgreSQL comme dernier rempart.
- Fichiers : bucket privé, chemins `workspace_id/document_id/version`, URLs signées de courte durée.
- Calendrier : composant dédié tel que FullCalendar après validation de sa licence et de son poids; modèle `events` interne comme source de vérité en phase 1.
- Recherche : PostgreSQL trigram/full-text sur métadonnées textuelles; aucun moteur externe en MVP.
- Automatisation : règles simples dans l’application; n8n séparé en phase 2, sans accès direct large à la base.
- Hébergement : région européenne cohérente pour application, base et automatisation; environnements local/préproduction/production séparés.

## Décisions de simplicité

- Pas d’ORM supplémentaire au départ si les types et migrations Supabase suffisent; réévaluer seulement si la couche métier le justifie.
- Pas de microservices, Redis, file de messages, GraphQL personnalisé ou moteur de recherche externe dans le MVP.
- Pas de copie de code provenant de Twenty, Plane, Papra ou Kimai sans audit de licence; reprendre seulement les patterns utiles.
- Pas de synchronisation bidirectionnelle Calendar avant d’avoir défini propriété, conflits, suppressions et déduplication.
- Pas de n8n dans le chemin critique des fonctions manuelles.

## Environnements et livraison

- Local : données factices uniquement.
- Préproduction : projet Supabase distinct, tests de migrations/RLS, fichiers synthétiques.
- Production personnelle : migrations approuvées, sauvegardes actives, monitoring minimal et données réelles.
- CI : lint, types, tests unitaires/intégration, migration sur base vide, tests RLS, build et E2E critiques.
- Déploiement : migration en amont compatible, application ensuite; rollback documenté. Aucune migration destructive sans export et confirmation.

## Budget recommandé

- Conception/prototype : offres gratuites, données fictives et pas de documents importants.
- Usage réel : prévoir Supabase Pro (actuellement 25 $/mois) pour les sauvegardes quotidiennes annoncées et éviter la mise en pause du Free; ajouter le coût d’hébergement Next.js selon le fournisseur.
- Phase 2 : comparer n8n Cloud Starter (actuellement 20 €/mois facturé annuellement) à un hébergement communautaire maintenu. Le cloud est préférable si l’administration d’un serveur n’apporte pas de valeur.
- Ne pas payer Notion + Make en parallèle sauf expérimentation temporaire clairement supprimable.

## Sources techniques

- [Sécurisation des données Supabase](https://supabase.com/docs/guides/database/secure-data)
- [Contrôle d’accès de Supabase Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [Base PostgreSQL et sauvegardes Supabase](https://supabase.com/docs/guides/database/overview)
- [Tarifs n8n](https://n8n.io/pricing/)
- [Tarifs Make](https://www.make.com/en/pricing)
- [Tarifs Notion](https://www.notion.com/pricing)

