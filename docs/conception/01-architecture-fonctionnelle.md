# 1. Architecture fonctionnelle

## Niveaux de données

### Niveau espace personnel

Le `workspace` est la frontière de sécurité. Il contient le propriétaire, ses préférences, ses organisations et tous ses objets métier. Une future ouverture à un second utilisateur exigerait une adhésion explicite dans `workspace_members`.

### Niveau organisation

Une organisation représente un contexte professionnel ou administratif : Soufflet Malt / InVivo, CROUS, CY Cergy, Formasup, etc. Les contacts, projets, contrats, missions, documents, événements et démarches peuvent lui être rattachés. Une vue d’organisation ne montre que ses données.

### Niveau global

Le dashboard, la recherche, le calendrier, les tâches, les rappels et l’historique agrègent les objets autorisés de toutes les organisations. Ils ne dupliquent pas les données; ils les interrogent avec leurs relations et affichent toujours l’organisation source.

## Modules

### Dashboard global

Objectif : décider rapidement quoi faire.

- Données globales : événements du jour, tâches en retard/urgentes, échéances de contrats et documents, démarches bloquées, contacts à relancer.
- Données calculées : heures CROUS semaine, heures restantes, missions actives, taux de tâches terminées.
- Actions : créer rapidement une tâche, un événement, une heure CROUS ou une note; ouvrir l’objet source.
- Règle : aucune donnée propre au dashboard; uniquement des vues calculées et des raccourcis.

### Soufflet Malt

Objectif : suivre l’alternance sans remplacer les outils de l’entreprise.

- Propres à l’espace : contrat d’alternance, mission « Chef de projet Industrie 4.0 », période, 35 h/semaine, maître d’apprentissage, pipeline contractuel, journal d’alternance.
- Partagées : contacts, missions, tâches, documents, communications, événements, notes et rappels.
- Spécificité : le journal contient apprentissages, problèmes, décisions et prochaines actions; il peut être lié à une mission ou une semaine.

### CROUS

Objectif : suivre le contrat, les interventions et l’objectif de 7 h/semaine.

- Propres à l’espace : paramètres de suivi horaire, interventions, total hebdomadaire/mensuel, journal de mission CROUS, pipeline du contrat.
- Partagées : contacts, documents, événements, missions, tâches, communications et rappels.
- Confidentialité : utiliser un libellé de situation anonymisé ou un identifiant local facultatif; ne pas stocker de dossier étudiant, données médicales, disciplinaires ou justificatifs de tiers.

### Contacts

Objectif : retrouver une personne et la prochaine action.

- Données : identité, coordonnées, rôle, organisation(s), tags, consentement/préférence de contact si utile, dernière interaction calculée, prochaine tâche calculée.
- Partagées : communications, événements, missions, documents et notes liés.
- Une personne peut être liée à plusieurs organisations; la relation contact–organisation porte le poste et le rôle contextuels.

### Missions

Objectif : piloter les résultats à produire.

- Mission : objectif, responsable, priorité, statut, dates, avancement et organisation.
- Tâche : action concrète, éventuellement sous-tâche, échéance et état.
- Partagées : contacts, documents, notes, événements, communications.
- Limite MVP : liste et Kanban simple; pas de sprints, capacité d’équipe, points ou dépendances complexes.

### Documents

Objectif : retrouver un fichier fiable et anticiper son expiration.

- Métadonnées : nom, catégorie, organisation, version, dates d’émission/expiration, statut, chemin privé, taille, type MIME et empreinte.
- Partagées : contrat, mission, démarche et contact via liens documentaires.
- Règle : le stockage binaire est privé; la base ne contient que les métadonnées et la référence de stockage.

### Calendrier

Objectif : visualiser les engagements et conflits.

- Événements internes : cours, entreprise, CROUS, réunion, deadline, personnel important.
- Partagées : organisation, contacts, mission, tâche ou démarche concernée.
- Calcul : conflit lorsque deux événements non annulés se chevauchent; affichage jour/semaine/mois.
- Phase 1 : saisie interne. Phase 2 : synchronisation Google Calendar avec identifiant externe et stratégie anti-doublon.

### Suivi administratif

Objectif : rendre visible la prochaine étape d’un dossier.

- Pipeline : modèle nommé, organisation, objet suivi et état général.
- Étape : ordre, statut, responsable, échéance, date de fin, commentaire et document associé.
- Partagées : contrats, documents, tâches, contacts et rappels.
- Limite : suivi de statut uniquement; aucune signature juridique ni soumission automatique.

### Communications

Objectif : conserver la trace utile d’un échange.

- Phase 1 : entrée manuelle (e-mail, appel, réunion, SMS, WhatsApp manuel), sujet, résumé, date, sens, contact(s), organisation et prochaine action.
- Phase 2 : références Gmail importées via OAuth, sans recopier tout le contenu si un résumé et un lien suffisent.
- Toute réponse générée reste un brouillon et nécessite une validation humaine avant envoi.

### Automatisations

Objectif : réduire les oublis après stabilisation du hub manuel.

- Phase 1 : règles déterministes internes pour signaler retards, expirations et conflits; pas d’éditeur de workflows.
- Phase 2 : n8n exécute les intégrations, écrit via une API serveur limitée et journalise résultat/erreur.
- Phase 3 : suggestions IA structurées; aucune mutation ou communication externe sans confirmation.

## Matrice de partage

| Objet | Organisation requise | Visible globalement | Peut lier plusieurs modules |
|---|---:|---:|---:|
| Contact | Non, mais recommandé | Oui | Oui |
| Mission | Oui | Oui | Oui |
| Tâche | Héritée ou facultative | Oui | Oui |
| Contrat | Oui | Oui | Oui |
| Document | Non | Oui | Oui |
| Événement | Non | Oui | Oui |
| Communication | Non | Oui | Oui |
| Note | Non | Oui | Oui |
| Heure CROUS | Oui | Oui, agrégée | Mission/événement |
| Pipeline administratif | Oui | Oui | Contrat/document |
| Rappel | Non | Oui | Oui |

