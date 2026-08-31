# Synthèse de décision

## Vision

Professional Hub — Euloge est une mémoire professionnelle personnelle : il centralise les actions, échéances, contacts, documents et heures, sans remplacer les systèmes officiels de Soufflet Malt, du CROUS, de CY Cergy ou du CFA.

Le produit doit répondre en moins de 30 secondes à cinq questions : que faire aujourd’hui, quelle est la prochaine échéance, où en est une démarche, où retrouver un document ou un contact, et combien d’heures CROUS ont été réalisées.

## Architecture retenue

Application web responsive en Next.js, PostgreSQL/Auth/Storage via Supabase et composants UI accessibles. n8n reste extérieur au cœur applicatif et n’est activé qu’en phase 2. Le produit est organisé autour d’un espace personnel (`workspace`) contenant plusieurs organisations. Tous les enregistrements métier portent un `workspace_id`; ceux rattachés à une structure portent aussi un `organization_id`.

## À construire maintenant

- Authentification et espace personnel unique.
- Organisations Soufflet Malt et CROUS préconfigurables, sans données sensibles inventées.
- Dashboard « Aujourd’hui / À faire / Échéances / Heures CROUS ».
- Contacts et historique manuel des échanges.
- Missions, tâches et sous-tâches.
- Documents privés et métadonnées d’expiration.
- Contrats et pipelines administratifs simples.
- Calendrier interne et détection des conflits.
- Saisie des heures CROUS et calculs semaine/mois.
- Journal d’alternance.
- Recherche globale minimale.
- Export JSON/CSV et journal d’audit de base.

## À faire attendre

- Synchronisation Gmail et Google Calendar par OAuth.
- n8n, notifications automatiques et résumé hebdomadaire.
- Assistant IA avec outils contrôlés et validation humaine.
- Import semi-automatique des pièces jointes et extraction de dates.
- PDF de synthèse et rapports mensuels avancés.

## À supprimer du MVP

- WhatsApp et tout connecteur non officiel.
- Envoi automatique d’e-mails ou de messages.
- OCR, RAG, analyse permanente de boîte mail.
- Signature électronique intégrée.
- Moteur d’automatisation configurable par l’utilisateur.
- Gestion RH, paie, facturation, temps multi-salariés ou fonctions d’ERP.
- Reprise ou déploiement complet de Twenty, Plane, Papra, Kimai ou Cal.com : ils servent uniquement de références de conception ciblées.

## Principes non négociables

- Une action externe reste une proposition tant que l’utilisateur ne l’a pas validée.
- Les données sur d’autres étudiants sont minimales, factuelles et supprimables.
- Les documents sont privés par défaut.
- Le dashboard agrège les organisations; chaque écran d’organisation reste filtré explicitement.
- Toute fonctionnalité future doit réduire un effort réel observé, pas seulement reproduire un outil existant.

