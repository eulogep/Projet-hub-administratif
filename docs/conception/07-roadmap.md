# 7. Roadmap

La roadmap est pilotée par l’usage, pas par une date arbitraire. Une phase ne commence que lorsque la précédente est utilisée avec des données réelles et que ses irritants sont observés.

## Phase 1 — Hub manuel solide

### But

Créer une source personnelle fiable qui résout les parcours de moins de 30 secondes sans dépendance externe.

### Lots

1. Fondation sécurisée : Auth, workspace, RLS, navigation et organisations.
2. Travail quotidien : contacts, missions/tâches, calendrier interne et heures CROUS.
3. Administration : documents privés, contrats et pipelines.
4. Mémoire : communications manuelles et journal d’alternance.
5. Synthèse : dashboard, recherche, rappels visuels, export et audit.

### Sortie de phase

- Utilisation réelle pendant quatre semaines.
- Les cinq parcours critiques réussis sur mobile et bureau.
- Sauvegarde/restauration et export testés.
- Aucune donnée d’un compte visible par un autre.
- Au moins 80 % des tâches, heures et échéances utiles sont saisies sans double système personnel.

## Phase 2 — Automatisations et intégrations

### But

Éliminer les doubles saisies réellement observées, avec contrôles humains.

### Ordre

1. Notifications internes fiables et jobs idempotents.
2. OAuth Google Calendar en lecture seule, rapprochement manuel, puis synchronisation contrôlée.
3. Gmail ciblé : messages de contacts connus ou libellé explicite; import d’une référence/résumé, jamais aspiration indiscriminée.
4. n8n externe : alertes d’expiration, suggestion de tâche depuis e-mail, résumé hebdomadaire.
5. Notifications e-mail/push opt-in avec centre de préférences.

### Garde-fous

- Journal d’exécution, déduplication, retries bornés et bouton de désactivation.
- Toute mutation proposée depuis un message est confirmée.
- Tout envoi externe est relu et validé.
- Synchronisation testée contre mises à jour, suppressions et conflits.

### Sortie de phase

- Chaque automatisation économise un effort mesuré.
- Taux de doublons et actions erronées connu et acceptable.
- Révocation OAuth testée; aucun secret dans le Hub ou les logs.
- Le Hub reste pleinement utilisable si n8n ou Google est indisponible.

## Phase 3 — Assistant IA et intelligence proactive

### But

Interroger et synthétiser les données autorisées, puis proposer des actions sûres.

### Capacités progressives

1. Questions en lecture seule via outils typés : tâches du jour, heures CROUS, échéances, dernier échange, pipelines.
2. Génération de compte rendu à partir de notes explicitement sélectionnées.
3. Brouillons de réponses ou messages, avec sources et validation humaine.
4. Suggestions proactives limitées : contact à relancer, mission inactive, document expirant.
5. Recherche documentaire augmentée seulement si la recherche par métadonnées est insuffisante et après classification des documents autorisés.

### Garde-fous

- L’assistant n’obtient jamais une copie aveugle de toute la base; il appelle des fonctions à portée limitée.
- Lecture et écriture sont séparées; chaque écriture affiche un diff ou récapitulatif à confirmer.
- Réponses citées par objet source, incertitude explicite, aucune invention de statut.
- Données CROUS de tiers et documents sensibles exclus par défaut des traitements IA.
- Conservation des prompts/réponses minimale et configurable.

### Sortie de phase

- Évaluation sur un jeu de questions attendu, exactitude et refus mesurés.
- Aucune action externe sans confirmation.
- L’utilisateur peut inspecter les sources et désactiver l’IA sans perdre le Hub.

## Décision finale de périmètre

### Construire maintenant

Phase 1 seulement : socle sécurisé, organisations, contacts, missions/tâches, calendrier interne, heures CROUS, documents, contrats/pipelines, notes/communications manuelles, dashboard, recherche, export et audit.

### Attendre

Google/Gmail OAuth, n8n, e-mail/push, rapports programmés et assistant IA jusqu’à preuve d’un usage manuel stable.

### Supprimer du MVP

WhatsApp, OCR, signature électronique, moteur de workflow générique, analyse continue d’e-mails, RAG, rapports IA, fonctions multi-équipe/ERP et synchronisation bidirectionnelle immédiate.

## Prochaine étape autorisée

Avant tout code : relire et valider cette conception, trancher les quelques paramètres produit (méthode de connexion, types de fichiers acceptés, conservation des logs, hébergeur/région, budget mensuel), puis transformer HUB-001 à HUB-005 en spécifications d’implémentation. Le démarrage du développement constitue une décision séparée.

