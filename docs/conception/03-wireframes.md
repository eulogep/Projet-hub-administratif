# 3. Wireframes textuels

## Cadre commun

### Bureau

```text
┌──────────── navigation latérale ────────────┬──────────── contenu ────────────┐
│ Logo / Espace                              │ Barre: recherche  + créer  profil│
│ Dashboard                                  │ Fil d’Ariane / titre / actions    │
│ Alternance                                 │                                  │
│ CROUS                                      │          écran actif             │
│ Contacts · Missions · Calendrier           │                                  │
│ Documents · Admin                          │                                  │
└────────────────────────────────────────────┴──────────────────────────────────┘
```

### Mobile

En-tête compact, recherche, bouton « + », contenu sur une colonne et navigation basse : Accueil, Tâches, Calendrier, Documents, Plus. Les actions secondaires passent dans un menu. Les formulaires s’ouvrent en page ou tiroir plein écran.

### États communs

- Chargement : squelettes stables, sans saut de mise en page.
- Erreur : message utile, bouton réessayer, aucun détail technique sensible.
- Hors ligne : lecture du dernier état si disponible; écriture désactivée et clairement signalée.
- Suppression : confirmation nommée; archivage proposé par défaut.
- Alertes : rouge pour retard/conflit, ambre pour attente/expiration, bleu pour information, vert pour terminé.

## Dashboard

```text
Bonjour Euloge                            [ + Ajouter ]
Lun. 31 août 2026
┌ Aujourd’hui ───────────┐ ┌ À faire ─────────────────┐
│ 09:00 Soufflet         │ │ 2 en retard · 3 semaine │
│ 18:00 CROUS            │ │ □ Envoyer le CERFA      │
└────────────────────────┘ └──────────────────────────┘
┌ Prochaines échéances ──┐ ┌ CROUS — semaine ─────────┐
│ Contrat · dans 4 j     │ │ 4 h 30 / 7 h · reste 2 h30│
└────────────────────────┘ └───────────────────────────┘
┌ Démarches ─────────────┐ ┌ Contacts à relancer ──────┐
└────────────────────────┘ └────────────────────────────┘
```

- Visible : cartes hiérarchisées, organisation et source sur chaque item, cinq prochains éléments maximum par carte.
- Boutons : « + Ajouter » (tâche, événement, heure, note), « Voir tout », cases de tâche, ouverture de l’objet.
- Filtres : aujourd’hui/cette semaine; organisation; masquer les éléments terminés.
- Navigation : chaque ligne mène à sa fiche; le total CROUS mène au suivi horaire.
- État vide : « Rien d’urgent aujourd’hui » puis deux actions rapides pertinentes.
- Alertes : conflit horaire, retard, document expirant, objectif CROUS dépassé ou incomplet.

## Fiche organisation

- En-tête : nom, type, couleur, période/projet actif, action « Modifier ».
- Onglets : Vue d’ensemble, Contacts, Missions, Documents, Contrats, Communications, Notes.
- Vue : prochaines échéances, mission active, pipeline, contacts clés et activité récente.
- Boutons : nouvelle mission, contact, document, contrat ou note, avec organisation préremplie.
- Filtres : statut, projet, période et archivés.
- État vide : explication de la section et une seule action primaire.
- Alertes : contrat ou document à échéance, mission bloquée, absence d’activité depuis sept jours (informatif en MVP).

## Fiche contact

```text
Norman Prunières             [Modifier] [Nouvel échange] [Créer tâche]
Soufflet Malt · Maître d’apprentissage
email · téléphone

Prochaine action                    Informations
Informer quand le contrat…          Organisations / rôle / notes

Chronologie
31/08  Réunion — résumé…
27/08  E-mail — avancement contrat…
```

- Visible : identité, rôles par organisation, coordonnées, prochaine tâche ouverte, timeline des communications/notes/événements.
- Actions : copier une coordonnée, consigner échange, créer tâche, lier document, archiver.
- Filtres timeline : type, organisation, période.
- État vide : « Aucun échange enregistré » avec bouton de saisie.
- Alertes : doublon potentiel à l’édition; coordonnées manquantes; relance en retard.

## Mission

- En-tête : titre, organisation, statut modifiable, priorité, dates, responsable.
- Corps : description, progression, sous-tâches, documents, notes/commentaires et activité.
- Actions : ajouter sous-tâche, note ou document; marquer bloquée/terminée; archiver.
- Navigation : fil d’Ariane organisation → projet → mission; liens vers contacts et pièces.
- Filtres : activité par type; sous-tâches actives/terminées.
- État vide : checklist vide avec « Ajouter la première action ».
- Alertes : échéance dépassée, tâche parent terminée avec sous-tâche ouverte, blocage sans commentaire.

## Contrat

- Visible : type, organisation, statut, période, temps hebdomadaire, rémunération si renseignée, parties liées, documents et pipeline.
- Actions : modifier statut, ajouter document, créer/ouvrir pipeline, créer rappel, archiver.
- Navigation : organisation et projet; clic sur document ou étape.
- Filtres : documents actifs/remplacés; étapes ouvertes/terminées.
- État vide : aucun document ou pipeline, avec action contextualisée.
- Alertes : date incohérente, document obligatoire manquant (seulement si une règle explicite le définit), signature suivie comme statut non comme signature légale.

## Document

- Visible : aperçu si sûr, nom, catégorie, organisation, statut, version, émission, expiration, taille/type, empreinte, objets liés et historique de versions.
- Actions : télécharger via URL signée courte, remplacer par une version, modifier métadonnées, lier, archiver, supprimer définitivement via parcours séparé.
- Navigation : retour au dossier/objet source; versions liées.
- Filtres : sans objet sur une fiche; la liste globale filtre organisation, catégorie, statut et expiration.
- État vide : sur la liste, zone de dépôt et bouton sélectionner; pas d’upload anonyme.
- Alertes : fichier trop volumineux/type interdit, expiration 90/60/30 jours, version remplacée, analyse antivirus en attente si ajoutée plus tard.

## Suivi heures CROUS

```text
Semaine 36   [‹] [Aujourd’hui] [›]             [+ Intervention]
Objectif 7 h 00 | Réalisé 4 h 30 | Restant 2 h 30
█████████████░░░░░░
Lun 31/08  18:00–20:00  2 h 00  Permanence    [⋯]
Mer 02/09  17:30–20:00  2 h 30  Accueil       [⋯]
Résumé mensuel: 11 h 30
```

- Visible : semaine ISO en Europe/Paris, objectif, réalisé, restant ou dépassement, lignes et résumé mensuel.
- Actions : saisir/modifier/dupliquer/supprimer une intervention; changer de semaine.
- Formulaire : date, début, fin, durée calculée, mission/type, lieu, commentaire minimal.
- Filtres : semaine/mois, activité.
- État vide : objectif visible et « Ajouter ma première intervention ».
- Alertes : chevauchement d’heures, fin avant début, plus de 12 h d’une traite, dépassement de l’objectif (avertissement, jamais blocage).

## Journal alternance

- Vue liste par semaine avec aperçu « fait / appris / prochaine action » et recherche.
- Éditeur : date/semaine, réalisé, appris, problèmes, solutions, personnes rencontrées (contacts), décisions, prochaines actions, missions liées.
- Actions : nouvelle entrée, enregistrer brouillon, finaliser, créer une tâche depuis une prochaine action, exporter la période.
- Navigation : depuis Alternance ou une mission; liens bidirectionnels.
- Filtres : période, mission, contact, brouillon/finalisé.
- État vide : modèle guidé en six questions.
- Alertes : sortie sans enregistrer; contenu potentiellement sensible rappelant de ne pas coller d’informations confidentielles de l’entreprise.

## Pipeline administratif

```text
Contrat alternance                          [Modifier les étapes]
[✓ Mission validée]—[✓ Formalink]—[● CERFA]—[○ Signatures]—[○ OPCO]

Étape active: CERFA généré                 [Marquer terminé]
Responsable · échéance · document · commentaire
```

- Visible : progression ordonnée, étape active, responsable, dates, document, activité récente.
- Actions : changer statut, commenter, joindre document, créer tâche/rappel; réordonner seulement en mode édition.
- Navigation : contrat/organisation; clic sur étape ouvre son panneau.
- Filtres : ouvert/terminé; dans la liste globale par organisation et état.
- État vide : choisir un modèle Soufflet/CROUS ou créer un pipeline minimal.
- Alertes : étape en retard, bloquée, terminée sans date; aucune progression automatique ambiguë.

## Calendrier

- En-tête : Aujourd’hui, précédent/suivant, vues jour/semaine/mois, « + Événement ».
- Colonne de filtres : catégories et organisations colorées; afficher/masquer les deadlines.
- Événement : titre, horaire, organisation, lieu, liens mission/tâche et source manuelle/externe.
- Actions : créer, déplacer/redimensionner avec confirmation, dupliquer, annuler, ouvrir l’objet lié.
- Navigation : clic ouvre panneau détail; le lien source mène à la mission/tâche.
- État vide : calendrier reste visible; aide « Cliquez sur un créneau ».
- Alertes : chevauchement matérialisé et liste « Conflits »; heure locale toujours affichée, source externe non modifiable si elle est en lecture seule.

## Recherche globale

La palette s’ouvre au clavier ou depuis l’en-tête. Résultats groupés (contacts, missions/tâches, documents, communications/notes, contrats, événements) avec organisation, extrait et date. Les résultats sensibles n’affichent pas le corps complet. État vide : proposer correction et filtres; aucune recherche dans les fichiers binaires en MVP.

