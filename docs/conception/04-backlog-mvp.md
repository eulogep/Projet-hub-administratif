# 4. Backlog MVP

> **Référence fonctionnelle historique.** La numérotation `T-XXXX` est désormais le seul système officiel d’exécution et de statut. Les entrées `HUB-XXX` ci-dessous servent uniquement à conserver la conception fonctionnelle initiale. Aucun nouveau ticket `HUB-XXX` ne doit être créé.

## Définition du MVP utilisable

Un utilisateur authentifié peut configurer ses deux contextes, saisir ses données, retrouver un objet, voir sa journée et ses échéances, suivre ses 7 h CROUS, puis exporter ses données. Aucun connecteur externe n’est nécessaire pour atteindre cette valeur.

## Tickets

### HUB-001 — Socle projet et qualité

- Objectif : initialiser Next.js TypeScript, UI, conventions, validation, migrations et CI.
- Priorité : P0.
- Dépendances : aucune.
- Acceptation : application responsive démarre; contrôles lint/type/tests/build sont documentés et passent; environnements sont séparés; aucune clé secrète n’est versionnée.
- Tests : smoke, lint, typecheck, build, vérification des variables requises.

### HUB-002 — Authentification et espace personnel

- Objectif : connexion, déconnexion, profil, workspace et garde des routes privées.
- Priorité : P0.
- Dépendances : HUB-001.
- Acceptation : utilisateur non connecté redirigé; session restaurée; un workspace propriétaire est créé idempotemment; aucune donnée d’un autre compte n’est lisible.
- Tests : intégration Auth, redirections, expiration de session, RLS croisée avec deux utilisateurs.

### HUB-003 — Schéma cœur et politiques RLS

- Objectif : créer tables, contraintes, indexes et politiques du périmètre phase 1.
- Priorité : P0.
- Dépendances : HUB-002.
- Acceptation : migrations reproductibles; `workspace_id` imposé; toutes tables exposées ont RLS; inserts inter-workspace et FK incohérentes échouent.
- Tests : migration up sur base vide, tests SQL de contraintes et matrice CRUD propriétaire/intrus.

### HUB-004 — Cadre applicatif responsive

- Objectif : navigation bureau/mobile, en-tête, recherche, états communs et accessibilité de base.
- Priorité : P0.
- Dépendances : HUB-001, HUB-002.
- Acceptation : pages principales accessibles au clavier; navigation mobile utilisable à 360 px; focus visible; chargement/erreur/vide cohérents.
- Tests : composants, navigation, axe/accessibilité automatisée, tailles bureau/mobile.

### HUB-005 — Organisations et projets

- Objectif : créer/éditer/archiver les contextes Soufflet et CROUS.
- Priorité : P0.
- Dépendances : HUB-003, HUB-004.
- Acceptation : fiche et onglets; filtres préservent l’organisation; assistant de démarrage demande confirmation; archivage ne supprime pas les objets.
- Tests : CRUD, unicité, filtrage, archivage, isolation RLS.

### HUB-006 — Contacts et rattachements

- Objectif : CRM personnel minimal et timeline manuelle.
- Priorité : P0.
- Dépendances : HUB-005.
- Acceptation : contact lié à une ou plusieurs organisations; recherche par nom/e-mail; prochaine action visible; doublons potentiels signalés sans blocage.
- Tests : CRUD, multi-organisation, recherche accentuée, timeline vide/remplie, RLS.

### HUB-007 — Missions, tâches et sous-tâches

- Objectif : suivre missions et actions par liste/Kanban simple.
- Priorité : P0.
- Dépendances : HUB-005, HUB-006.
- Acceptation : statuts/priorités/dates modifiables; sous-tâche de niveau unique; retards calculés; mission terminée cohérente; filtres organisation/statut.
- Tests : transitions, dates, parentage, calcul retard, filtres, vues responsive.

### HUB-008 — Documents privés

- Objectif : upload, métadonnées, téléchargement privé, version et expiration.
- Priorité : P0.
- Dépendances : HUB-003, HUB-005.
- Acceptation : bucket privé; chemin non devinable et isolé; URL signée courte; type/taille validés; expiration filtrable; remplacement conserve l’historique.
- Tests : upload/download propriétaire, refus intrus, type/taille, lien expiré, versionnage, suppression/archivage.

### HUB-009 — Contrats

- Objectif : fiche contrat et liens vers documents/projet.
- Priorité : P0.
- Dépendances : HUB-005, HUB-008.
- Acceptation : période, statut, temps et rémunération optionnelle; documents liés; dates invalides refusées; contrat retrouvable en moins de 30 secondes depuis organisation ou recherche.
- Tests : CRUD, contraintes, liens, permissions, navigation.

### HUB-010 — Pipelines administratifs

- Objectif : suivre les étapes Soufflet et CROUS.
- Priorité : P0.
- Dépendances : HUB-009, HUB-006.
- Acceptation : modèle d’étapes copiable après confirmation; ordre stable; prochaine étape visible; statut/date/responsable/document/commentaire; retard signalé.
- Tests : création depuis modèle, ordre, transitions, étape bloquée/terminée, calcul progression.

### HUB-011 — Calendrier interne et conflits

- Objectif : vues jour/semaine/mois et événements manuels.
- Priorité : P0.
- Dépendances : HUB-005, HUB-007.
- Acceptation : couleurs par catégorie; création/édition/annulation; fuseau Europe/Paris; chevauchements non annulés signalés; deadlines de tâches affichables.
- Tests : DST/fuseau, chevauchement exact/partiel, all-day, filtres, interaction mobile.

### HUB-012 — Suivi des heures CROUS

- Objectif : saisir les interventions et calculer objectif/réalisé/reste.
- Priorité : P0.
- Dépendances : HUB-005, HUB-011.
- Acceptation : début/fin donnent une durée modifiable avec justification; semaine ISO; totaux semaine/mois exacts; dépassement affiché; chevauchement signalé.
- Tests : calculs minutes, changement d’heure, semaine à cheval sur mois/année, chevauchement, agrégats et RLS.

### HUB-013 — Notes et journal d’alternance

- Objectif : capturer l’expérience hebdomadaire et créer des actions.
- Priorité : P1.
- Dépendances : HUB-005, HUB-007, HUB-006.
- Acceptation : entrée guidée, brouillon/finalisation, liens missions/contacts, création d’une tâche depuis prochaine action, filtre par période.
- Tests : validation, autosauvegarde si retenue, liens, création tâche idempotente, contenu sensible signalé.

### HUB-014 — Communications manuelles

- Objectif : journaliser appels, réunions, e-mails et messages importants.
- Priorité : P1.
- Dépendances : HUB-006.
- Acceptation : canal/sens/date/résumé/participants; timeline contact; tâche de suivi optionnelle; aucune fonction d’envoi.
- Tests : CRUD, multi-participants, ordre timeline, création de suivi, RLS.

### HUB-015 — Dashboard décisionnel

- Objectif : agréger journée, tâches, échéances, pipeline et heures.
- Priorité : P0.
- Dépendances : HUB-007 à HUB-012.
- Acceptation : chaque carte ouvre la source; retards et échéances exacts; max cinq lignes par carte; filtres période/organisation; rendu utile avec données partielles.
- Tests : requêtes d’agrégation, limites temporelles, fuseau, états vides, performance sur jeu réaliste.

### HUB-016 — Recherche globale

- Objectif : retrouver rapidement contacts, tâches/missions, documents, contrats, notes/communications et événements.
- Priorité : P1.
- Dépendances : HUB-006 à HUB-014.
- Acceptation : résultats groupés avec organisation; accents/casse tolérés; résultats archivés masqués par défaut; aucun extrait sensible excessif; réponse cible < 500 ms sur jeu personnel réaliste.
- Tests : pertinence, accents, droits, archivés, limite/extraits, performance.

### HUB-017 — Rappels internes déterministes

- Objectif : afficher expiration 90/60/30 jours, retards et prochaine étape sans moteur générique.
- Priorité : P1.
- Dépendances : HUB-008, HUB-010, HUB-015.
- Acceptation : règles idempotentes; aucun doublon; possibilité de masquer; aucun e-mail/push en MVP.
- Tests : seuils, dates passées, fuseau, déduplication, acquittement.

### HUB-018 — Export et portabilité

- Objectif : exporter toutes les données de l’espace.
- Priorité : P0 avant mise en production personnelle.
- Dépendances : HUB-003 et modules terminés.
- Acceptation : JSON documenté et ZIP de CSV; fichiers binaires inclus ou inventoriés avec checksums; export privé temporaire; suppression automatique du paquet; encodage UTF-8.
- Tests : exhaustivité référentielle, CSV avec accents, checksum, isolation, expiration du lien, gros fichier raisonnable.

### HUB-019 — Audit, observabilité et sauvegarde

- Objectif : tracer les actions importantes et préparer la restauration.
- Priorité : P0 avant données réelles.
- Dépendances : HUB-003, HUB-008.
- Acceptation : connexion, création/modification/suppression, export et action admin tracés sans secret; politique de sauvegarde DB + fichiers documentée; exercice de restauration réalisé en préproduction.
- Tests : immutabilité du log, absence de secret/contenu complet, génération des événements, procédure de restauration.

### HUB-020 — Recette MVP et amorçage contrôlé

- Objectif : valider les parcours de moins de 30 secondes et préparer l’usage réel.
- Priorité : P0 final.
- Dépendances : HUB-001 à HUB-019 selon priorité MVP.
- Acceptation : cinq parcours critiques réussis sur mobile et bureau; données d’exemple séparées puis supprimables; aucune intégration externe active; checklist sécurité validée.
- Tests : E2E des parcours, audit accessibilité, test multi-compte, sauvegarde/restauration, export, test manuel utilisateur.

## Ordre de livraison conseillé

1. Fondation : HUB-001 à HUB-005.
2. Cœur quotidien : HUB-006 à HUB-012.
3. Synthèse : HUB-015, puis HUB-013/014/016/017.
4. Mise en confiance : HUB-018 à HUB-020.

Le premier incrément démontrable s’arrête à organisations + tâches + calendrier + heures CROUS. Les documents ne doivent recevoir de vraies pièces qu’après validation de la sécurité et de la sauvegarde.
