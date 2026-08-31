# 6. Sécurité

## Modèle de menace simplifié

Actifs prioritaires : documents d’identité/contrats/RIB, coordonnées, calendrier, communications, tokens OAuth et historique professionnel. Menaces : accès d’un autre compte, lien de fichier divulgué, clé serveur exposée, automatisation trop permissive, export oublié, appareil perdu et collecte excessive de données sur des tiers.

## Authentification

- Supabase Auth avec e-mail magic link ou mot de passe fort; MFA TOTP à activer avant stockage de documents très sensibles si disponible dans l’offre retenue.
- Cookies de session sécurisés, `HttpOnly`, `Secure`, `SameSite=Lax` ou plus strict selon le flux OAuth.
- Toutes les routes produit exigent une session; réauthentification pour export complet, suppression définitive et connexion d’un fournisseur.
- Limitation de débit sur connexion, export, upload et endpoints d’intégration.
- Aucune réponse ne révèle si un autre compte ou fichier existe.

## Isolation

La frontière de sécurité est `workspace_id`, pas `organization_id`. Un propriétaire peut volontairement agréger ses organisations dans le dashboard; un autre utilisateur ne doit jamais voir ces lignes.

- RLS activée sur toutes les tables exposées.
- Politique standard : autoriser une opération seulement si `workspace_members.user_id = auth.uid()` et si le rôle permet l’action.
- `organization_id` doit appartenir au même workspace, garanti en base.
- Tests automatisés à deux comptes pour chaque table et opération CRUD.
- La clé `service_role`, qui contourne la RLS, n’est jamais envoyée au navigateur. Supabase rappelle explicitement que les clés service/secret doivent rester côté serveur.
- MVP personnel : rôle `owner` seul en production. Les rôles editor/viewer restent conçus mais non exposés tant que le partage n’est pas nécessaire.

## Documents

- Bucket privé; aucune URL publique persistante.
- Politique Storage fondée sur le propriétaire/workspace et chemin validé côté serveur; une simple propriété d’objet ne constitue pas à elle seule un contrôle d’accès.
- Téléchargement par URL signée très courte; nom de stockage aléatoire, nom humain en métadonnée.
- Liste blanche de formats, limite de taille, contrôle MIME + extension, empreinte SHA-256.
- Antivirus asynchrone avant mise à disposition de formats à risque si des documents Office/PDF externes sont acceptés; sinon restreindre aux formats nécessaires.
- Chiffrement en transit TLS et au repos fourni par l’hébergeur; pour les pièces les plus sensibles, évaluer un chiffrement applicatif avec gestion de clés séparée.
- Suppression définitive coordonnée entre base, Storage, versions, exports temporaires et sauvegardes selon une politique de rétention documentée.

## Secrets et intégrations

- Variables serveur et coffre de secrets; jamais dans Git, logs, base métier, bundle frontend ou fichier exporté.
- Jamais de mot de passe Gmail, WhatsApp, Microsoft ou autre service.
- OAuth 2.0 avec PKCE/`state`, URI de redirection exacte et scopes minimaux; demander l’accès Gmail/Calendar séparément au moment du besoin.
- Tokens chiffrés dans un coffre géré; la base ne conserve qu’une référence. Rotation/révocation et état d’expiration visibles.
- n8n utilise un compte technique et une API du Hub à portée limitée, jamais une clé `service_role` générale si une capacité étroite suffit.
- Webhooks signés, horodatés, protégés contre rejeu et idempotents.
- Aucun e-mail/message n’est envoyé automatiquement : génération → aperçu → validation explicite → envoi → audit.

## Sauvegardes et reprise

- En usage réel, offre avec sauvegardes PostgreSQL automatiques; Supabase annonce actuellement sept jours de rétention quotidienne sur Pro.
- Les sauvegardes de base Supabase ne couvrent pas les objets Storage : sauvegarder/versionner séparément les fichiers et leur manifeste d’empreintes.
- Export chiffré périodique vers une destination contrôlée distincte; clé de chiffrement séparée.
- Test trimestriel de restauration en préproduction : base, fichiers, relations, accès et checksums.
- Objectifs initiaux : RPO 24 h, RTO 4 h pour un usage personnel; documenter tout écart.
- Avant une migration destructive : export vérifié et plan de retour.

## Export et suppression

- JSON canonique versionné, CSV UTF-8 par type d’objet, manifeste des fichiers avec checksum; PDF uniquement comme synthèse lisible.
- Export généré côté serveur, privé, URL courte, expiration automatique et audit.
- Fonction de suppression du compte en deux temps : export recommandé, confirmation forte, délai de grâce éventuel, puis purge des données actives et fichiers.
- Les sauvegardes suivent une durée de rétention connue; ne pas promettre une disparition instantanée des copies de sécurité.

## Logs et confidentialité

- Tracer : connexions sensibles, changements de droits, créations/modifications/suppressions, exports, téléchargements de documents sensibles, connexions OAuth et actions d’automatisation.
- Ne jamais tracer : mots de passe, tokens, corps complet des e-mails, contenu des documents, RIB, données personnelles de tiers ou payloads bruts d’OAuth.
- Logs append-only, horodatés UTC, durée de conservation définie (proposition MVP : 90 jours pour logs techniques, historique métier conservé tant que l’objet existe).
- Messages d’erreur publics génériques; détails techniques corrélés par identifiant dans les logs privés.

## Minimisation CROUS et entreprise

- Pour une intervention CROUS : conserver date, lieu, catégorie de situation, action, résultat et suivi. Le nom d’un étudiant est facultatif et remplacé de préférence par un identifiant local non réversible.
- Interdire les pièces justificatives, données de santé, appréciations, diagnostics, sanctions ou informations familiales de tiers.
- Pour Soufflet : ne pas copier de secrets industriels, fichiers internes confidentiels, données clients ou identifiants d’entreprise; stocker un résumé personnel non confidentiel et un lien vers l’outil officiel quand possible.
- Afficher des rappels contextuels dans les formulaires de journal, communication et document.

## Checklist avant données réelles

- RLS testée avec deux utilisateurs sur chaque table et Storage.
- Clé service absente du client et du dépôt.
- Sauvegarde DB + fichiers et restauration testées.
- Export complet vérifié.
- Région et sous-traitants évalués selon les données réellement stockées.
- MFA et récupération de compte configurées.
- Types de fichiers et tailles limités.
- Logs inspectés pour vérifier l’absence de secrets.
- Données de démonstration supprimées ou clairement séparées.

