# T-0008 LARGE FILE STORAGE & SECURITY REPORT

Date de recherche : 2026-09-02
Portée : décision d'architecture préalable à T-0008 — Private Documents
État : recherche terminée, implémentation non autorisée

## 1. Sources reviewed

Les sources primaires ont été privilégiées. Les projets sous copyleft sont étudiés comme références de conception uniquement ; aucun code n'est proposé à la copie.

| Source | Licence | Capacité examinée | Classe de réutilisation | Risque principal |
| --- | --- | --- | --- | --- |
| [Supabase — Standard Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads) | Documentation propriétaire | Upload multipart ; recommandé jusqu'à 6 Mo, limite technique annoncée à 5 Go | Référence fournisseur | Non reprenable après coupure ; proxy applicatif tentant mais dangereux pour la mémoire |
| [Supabase — Resumable Uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads) | Documentation propriétaire | TUS, reprise, progression, jeton utilisateur ou upload signé, URL valable 24 h, blocs imposés de 6 MiB | **À utiliser maintenant** | Dépendance au protocole et aux contraintes Supabase |
| [Supabase — File limits](https://supabase.com/docs/guides/storage/uploads/file-limits) | Documentation propriétaire | 50 Mo maximum sur Free ; jusqu'à 500 Go configurables sur Pro/Team | Contrainte de déploiement | Un objectif de 100 MiB exige une offre/configuration compatible |
| [Supabase — Buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets) | Documentation propriétaire | Bucket privé, limite de taille et allowlist MIME côté Storage | À utiliser maintenant | La contrainte MIME fournisseur ne remplace pas l'inspection du contenu |
| [Supabase — Bucket fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals) | Documentation propriétaire | Accès privé soumis à RLS ; téléchargement authentifié ou signé | À utiliser maintenant | Une URL signée est un secret temporaire transmissible |
| [Supabase — Storage access control](https://supabase.com/docs/guides/storage/security/access-control) | Documentation propriétaire | Policies `storage.objects`, INSERT pour upload, SELECT/UPDATE pour upsert | À utiliser maintenant | Une policy incomplète ouvre une fuite inter-workspaces |
| [Supabase — Object ownership](https://supabase.com/docs/guides/storage/security/ownership) | Documentation propriétaire | `owner_id` dérivé du JWT ; la propriété n'est pas une autorisation | À utiliser maintenant | Confondre ownership et RLS ; objets sans propriétaire avec service role |
| [Supabase — Storage schema](https://supabase.com/docs/guides/storage/schema/design) | Documentation propriétaire | Tables Storage à traiter en lecture seule, mutations via API | À utiliser maintenant | Supprimer directement une ligne ne supprime pas les octets |
| [Supabase — S3 uploads](https://supabase.com/docs/guides/storage/uploads/s3-uploads) | Documentation propriétaire | Multipart parallèle, retry par partie, abandon automatique après 24 h | Adaptation possible | Signature et orchestration plus complexes ; reprise moins simple côté navigateur |
| [Supabase — S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility) | Documentation propriétaire | API compatible S3, SigV4, pas de versioning S3 natif | Référence future | Ajouter AWS SDK ne donne pas le versioning attendu par le produit |
| [Uppy repository](https://github.com/transloadit/uppy) et [Uppy TUS](https://uppy.io/docs/tus/) | MIT | UI modulaire, progression, pause/reprise/annulation et client TUS | **À utiliser maintenant** | Cycle de versions majeur ; intégration client-only à isoler |
| [TUS protocol](https://github.com/tus/tus-resumable-upload-protocol/blob/main/protocol.md) | MIT | Offsets, reprise, expiration, checksum et terminaison optionnels | Référence de protocole | Toutes les extensions sont optionnelles ; les détecter avant de s'y fier |
| [file-type](https://github.com/sindresorhus/file-type) | MIT | Détection best-effort par magic bytes sur buffer/stream | À utiliser maintenant, version compatible | Une signature valide ne prouve ni innocuité ni conformité complète |
| [file-type 21.3.4](https://github.com/sindresorhus/file-type/blob/v21.3.4/package.json) | MIT | Version ESM compatible Node >=20 | À utiliser maintenant | La v22 exige Node >=22, au-dessus du contrat actuel `>=20.9` |
| [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) | CC BY-SA 4.0 | Allowlist, renommage aléatoire, limites, signature, stockage privé, défense en profondeur | Exigences de sécurité | Sans antivirus/CDR, un risque de contenu hostile demeure |
| [Paperless-ngx API](https://github.com/paperless-ngx/paperless-ngx/blob/dev/docs/api.md) et [consumer](https://github.com/paperless-ngx/paperless-ngx/blob/dev/src/documents/consumer.py) | GPL-3.0 | Versions immuables, checksum, allocation sous verrou | Inspiration de modèle uniquement | Copie de code interdite sans assumer la GPL ; architecture plus large que le ticket |
| [Papra](https://github.com/papra-hq/papra) | AGPL-3.0 | UX d'archivage documentaire, filtres, organisations | Inspiration UX uniquement | Copie de code incompatible avec une réutilisation permissive/propriétaire |
| [tusd](https://github.com/tus/tusd) | MIT | Serveur TUS officiel, hooks et backends S3 compatibles | Architecture future | Nouvelle exploitation, supervision, sauvegarde et surface d'attaque |
| [Cloudflare R2 limits](https://developers.cloudflare.com/r2/platform/limits/), [multipart](https://developers.cloudflare.com/r2/objects/upload-objects/) et [presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) | Documentation propriétaire | Objets multi-TiB, multipart, PUT présigné | Architecture future | Deuxième fournisseur, credentials/presign, lifecycle et coûts d'opérations |
| [AWS SDK v3 `Upload`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-storage/Class/Upload/) | Apache-2.0 pour le SDK | Multipart, progression et annulation | Adaptation future | Dépendances lourdes et surface de configuration inutile pour TUS Supabase |
| [MinIO](https://github.com/minio/minio/blob/master/LICENSE) | AGPL-3.0 | Stockage objet S3 auto-hébergé | Architecture future | Coût d'exploitation et obligations AGPL si le code est modifié/distribué |

Note de cohérence documentaire : Supabase mentionne selon les pages 50 Go pour certaines méthodes de transfert et jusqu'à 500 Go comme plafond global configurable des offres payantes. Pour T-0008, seule la limite choisie de **100 MiB** est pertinente et doit être validée dans le projet réel avant release.

## 2. Comparison matrix

| Candidat | Reprise | Progression | Mémoire serveur | RLS/auth | Complexité | Portabilité | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. Supabase standard upload | Non | Oui, limitée | Faible en direct ; élevée si proxy Next.js | Native | Faible | Faible | **REJECT** comme chemin principal |
| B. `tus-js-client` + Supabase TUS | Oui | Oui | Nulle pour l'upload | JWT ou jeton signé + RLS | Moyenne | Bonne via TUS | **POSSIBLE ADAPTATION** si UI headless future |
| C. Uppy + Supabase TUS | Oui | Oui, pause/retry/cancel | Nulle pour l'upload | JWT ou jeton signé + RLS | Moyenne | Bonne via TUS | **USE NOW** |
| D. Supabase S3 multipart + AWS SDK | Oui par parties | Oui | Nulle en direct | Presign/SigV4 + RLS à concevoir | Élevée | Bonne via S3 | **POSSIBLE ADAPTATION** côté serveur/futur |
| E. Cloudflare R2 multipart | Oui par parties | Oui | Nulle en direct | Presign spécifique + autorisation applicative | Élevée | Bonne via S3 | **FUTURE ARCHITECTURE** |
| F. tusd + stockage S3 | Oui | Oui | Nulle pour l'app | Auth/hooks à exploiter soi-même | Très élevée | Très bonne | **REJECT** pour T-0008 |
| G. MinIO multipart | Oui par parties | Oui | Nulle en direct | Auth/policies à exploiter soi-même | Très élevée | Très bonne via S3 | **REJECT** pour T-0008 |

Uppy est retenu parce qu'il ajoute au client TUS l'état UX exigé (progression, retry, pause/reprise, annulation et accessibilité) sans créer un serveur d'upload. Supabase TUS est retenu parce qu'il conserve le bucket privé, l'authentification existante et les policies Storage. Le standard upload est écarté au-dessus de 6 Mo conformément à la recommandation Supabase.

## 3. Benchmark / test results

### Protocole prévu

- Fichiers synthétiques aléatoires, sans données réelles, aux tailles 1, 5, 25, 50 et 100 MiB ; 250 MiB seulement si le plafond et le temps le permettent.
- Bucket privé, `upsert: false`, bloc TUS exactement 6 MiB, un upload simultané par défaut.
- Mesures : durée, débit, pic RSS du processus Next.js, reprise après coupure, retry, annulation, exactitude du nombre d'octets et SHA-256 final.
- Succès attendu : l'upload contourne Next.js, le pic RSS Next.js ne croît pas avec la taille, et la reprise continue depuis l'offset confirmé.

### Résultats observés le 2026-09-02

| Taille | Upload | Reprise | Mémoire | Résultat |
| --- | --- | --- | --- | --- |
| 1 MiB | Non exécuté | Non exécutée | Non mesurée | Storage local désactivé et moteur Docker Desktop indisponible |
| 5 MiB | Non exécuté | Non exécutée | Non mesurée | Même blocage |
| 25 MiB | Non exécuté | Non exécutée | Non mesurée | Même blocage |
| 50 MiB | Non exécuté | Non exécutée | Non mesurée | Même blocage |
| 100 MiB | Non exécuté | Non exécutée | Non mesurée | Même blocage |
| 250 MiB | Non exécuté | Non exécutée | Non mesurée | Test optionnel non praticable dans cet environnement |

Le dépôt configure actuellement `[storage] enabled = false`. Une activation temporaire a été tentée avec une limite de 300 MiB, puis `supabase start` a échoué car le moteur `dockerDesktopLinuxEngine` était introuvable. La configuration a été restaurée à l'identique ; aucun octet synthétique, paquet ou artefact de test n'a été conservé. **Aucun chiffre de performance n'est inféré ou inventé.**

Les tests 1/5/25/50/100 MiB, coupure/reprise et mémoire deviennent donc une condition obligatoire avant `READY_FOR_REVIEW`, dès que Docker/Storage local ou un environnement Supabase jetable compatible est disponible.

## 4. Security analysis

### Contrôle d'accès et confidentialité

- Bucket `professional-documents` privé ; aucune policy publique.
- Le navigateur reçoit uniquement une autorisation TUS liée à l'utilisateur connecté et à un chemin exact réservé par le serveur. Le service role reste interdit.
- Les policies `storage.objects` vérifient `bucket_id`, `auth.uid()`, le workspace possédé et le préfixe opaque. L'UI n'est jamais la frontière d'autorisation.
- Un téléchargement exige d'abord l'autorisation DB sur le document/version, puis une URL signée d'au plus 60 secondes. Cette URL est un bearer secret : jamais de log, analytics, referrer ou stockage persistant.
- `Content-Disposition: attachment` et `X-Content-Type-Options: nosniff`; aucun rendu inline, preview HTML/PDF ou traitement actif dans T-0008.

### Validation du fichier

- Allowlist initiale : PDF, PNG et JPEG seulement.
- Accord obligatoire entre extension normalisée, MIME déclaré, magic bytes détectés et type attendu. Le nom original est une métadonnée d'affichage nettoyée, jamais un chemin.
- `file-type@21.3.4` est proposé parce qu'il reste compatible avec Node >=20 ; sa détection est best-effort et complète une validation explicite, elle ne remplace pas un antivirus.
- Taille déclarée contrôlée avant création, limite bucket contrôlée par Storage, taille réelle recontrôlée à la finalisation.
- Absence d'antivirus/CDR : risque résiduel accepté seulement avec allowlist étroite, téléchargement en pièce jointe et aucun rendu. Élargir les formats est hors scope et requiert un nouveau gate sécurité.

### Intégrité et mémoire

- Le SHA-256 provenant du navigateur ne doit jamais être considéré comme fiable.
- Après upload, la finalisation serveur relit l'objet privé en **stream authentifié**, alimente `node:crypto` SHA-256 et inspecte les premiers octets avec une mémoire bornée. L'upload lui-même ne passe jamais par Next.js.
- La version ne devient `ready` que si taille, type et SHA-256 serveur concordent avec les métadonnées attendues. En cas d'échec, elle reste invisible et l'objet exact est marqué pour nettoyage compensatoire.
- Pour des fichiers futurs multi-Go, cette seconde lecture synchrone deviendrait coûteuse ; un worker asynchrone serait alors nécessaire. À 100 MiB, elle est un compromis explicite en faveur de l'intégrité.

### États, concurrence et orphelins

- Ajouter une table minimale `document_upload_sessions` avec états `pending`, `uploading`, `finalizing`, `ready`, `failed`, `cancelled`, `expires_at`, chemin exact, taille/type attendus et propriétaire/workspace.
- Les documents incomplets ne sont jamais visibles. Lors d'un remplacement, la version actuelle reste lisible pendant le nouvel upload.
- Allocation de version dans une fonction SQL transactionnelle : verrouillage de la ligne document (`FOR UPDATE`), prochain numéro, insertion immuable et bascule atomique du pointeur courant. La contrainte unique `(document_id, version_number)` protège aussi contre la course.
- `upsert: false` et nouveaux chemins à chaque tentative/version, conformément à la recommandation Supabase d'éviter l'écrasement et les incohérences CDN.
- Les sessions expirées et objets orphelins sont réconciliés par chemin exact ; aucune suppression par préfixe large. Une annulation ne peut supprimer que l'objet de sa propre session.

### Menaces résiduelles

- URL signée copiée avant expiration.
- Fichier polyglotte ou PDF hostile passant la vérification de signature.
- Déni de service par répétition d'uploads autorisés : limiter concurrence, taille, quotas et fréquence côté création de session.
- Coupure entre stockage et finalisation : état persistant et réconciliation nécessaires.
- Dépendance fournisseur : l'interface fournisseur doit isoler le protocole sans devenir un framework générique.

## 5. Recommended architecture

**Architecture unique recommandée : Uppy + `@uppy/tus` vers Supabase TUS, bucket Supabase privé, métadonnées/versioning PostgreSQL et finalisation serveur en streaming.**

Flux exact :

1. Une Server Action/route authentifiée valide le workspace, le contexte métier, le nom, le type et la taille, crée `document_upload_sessions`, réserve `{workspace_id}/{document_id}/{version_uuid}` et obtient une autorisation d'upload signée avec le client Supabase de l'utilisateur.
2. Un composant client Uppy envoie directement au point TUS Supabase par blocs de 6 MiB, `upsert: false`, avec retry progressif. Progression, pause, reprise et annulation sont exposées de façon accessible.
3. À la fin, le client appelle la finalisation ; le serveur revalide session/utilisateur/workspace et existence de l'objet.
4. Le serveur lit l'objet en stream authentifié, calcule SHA-256, compte les octets et vérifie la signature. Aucun buffering complet et aucune donnée réelle en log.
5. Une fonction DB transactionnelle alloue la version, insère `document_versions`, avance `current_version_number` et marque la session `ready`. La liste n'affiche que les versions finalisées.
6. Les échecs passent à `failed`; une réconciliation bornée supprime uniquement les objets expirés associés à une session non finalisée.
7. Les téléchargements restent des URLs signées <=60 secondes après autorisation DB, avec disposition `attachment`.

Interface minimale de portabilité, sans abstraction spéculative :

```ts
interface DocumentStorageProvider {
  createUpload(input: AuthorizedUploadIntent): Promise<ResumableUploadGrant>;
  objectExists(ref: StorageObjectRef): Promise<StorageObjectMetadata>;
  openReadStream(ref: StorageObjectRef): Promise<ReadableStream<Uint8Array>>;
  createDownloadUrl(ref: StorageObjectRef, expiresInSeconds: number): Promise<string>;
  deleteExactOrphan(ref: StorageObjectRef): Promise<void>;
}
```

Supabase est la seule implémentation de T-0008. R2/MinIO/tusd ne sont pas ajoutés.

## 6. Initial max

**Maximum initial recommandé : 100 MiB (104 857 600 octets) par version.**

Raisons : seuil réellement « large » mais encore compatible avec une finalisation streaming synchrone bornée ; 17 blocs TUS au maximum avec le bloc imposé de 6 MiB ; marge raisonnable avant une architecture worker/multipart multi-Go.

Conditions non négociables :

- environnement Supabase payant/configuré au-dessus de 100 MiB ; l'offre Free plafonnée à 50 Mo ne satisfait pas cette décision ;
- limite bucket exacte de 100 MiB, doublée d'une validation applicative en octets ;
- tests locaux/jetables 1, 5, 25, 50 et 100 MiB réussis avant review ;
- 250 MiB reste hors limite produit et sert uniquement de test exploratoire si l'environnement le permet.

## 7. Dependency changes

Paquets de production exacts à ajouter après approbation :

- `@uppy/core`
- `@uppy/dashboard`
- `@uppy/tus`
- `file-type@21.3.4`

Contraintes :

- Installer uniquement les modules Uppy nécessaires, jamais le bundle `uppy` complet, Companion, AWS SDK ou un serveur TUS.
- Verrouiller les trois paquets Uppy sur une même génération après un spike de compatibilité Next.js 16/React 19. Uppy 6.0.0 vient de sortir au moment de l'étude ; ne pas l'adopter sans tests dédiés. Le lockfile doit figer les versions retenues.
- `file-type@22` est refusé tant que `package.json` annonce Node `>=20.9`, car sa version 22 exige Node >=22. `21.3.4` annonce Node >=20.
- Utiliser `node:crypto` natif pour SHA-256 ; n'ajouter aucun paquet de hash.
- Aucun `@aws-sdk/*`, `tus-js-client` direct, MinIO SDK, R2 SDK, antivirus, OCR ou preview.

## 8. Required ticket changes

Le plan T-0008 actuel doit être amendé **avant implémentation** :

1. Remplacer partout la limite 10 MiB par 100 MiB et ajouter comme précondition un projet Supabase compatible (>50 Mo).
2. Remplacer l'upload simple/server-proxy par Uppy + TUS direct, bloc 6 MiB, reprise, pause, retry et annulation.
3. Ajouter `document_upload_sessions` et les états persistants `pending/uploading/finalizing/ready/failed/cancelled`.
4. Préciser que le SHA-256 est calculé côté serveur par lecture streaming de l'objet final ; une valeur client n'est pas une preuve.
5. Ajouter l'allocation transactionnelle sous verrou des versions et la conservation de la version courante pendant un remplacement.
6. Ajouter la réconciliation des sessions expirées et le nettoyage strictement limité au chemin exact.
7. Ajouter aux tests obligatoires les tailles 1/5/25/50/100 MiB, pic mémoire, coupure/reprise, refresh de page, retry 429/5xx, annulation, course de remplacement, finalisation idempotente et orphelins.
8. Ajouter `package.json` et `package-lock.json` aux fichiers autorisés pour les quatre dépendances listées.
9. Retirer toute suggestion de `next.config.ts` pour augmenter une taille de body : les octets ne transitent pas par Next.js.
10. Maintenir PDF/PNG/JPEG seulement, pièce jointe uniquement, sans antivirus, preview, OCR, recherche, contrats ou intégrations.

## 9. Risks

| Risque | Gravité | Mitigation / gate |
| --- | --- | --- |
| Benchmark local absent | Élevée | Exécuter la matrice complète avant `READY_FOR_REVIEW` |
| Offre Supabase Free incompatible avec 100 MiB | Bloquante | Confirmer et configurer Pro/Team ou réduire explicitement le plafond par nouvelle décision humaine |
| Fuite inter-workspaces | Critique | Tests RLS/Storage symétriques deux utilisateurs, anon denied, paths hostiles |
| PDF hostile sans antivirus | Élevée, résiduelle | Allowlist, magic bytes, attachment-only, no preview ; décision sécurité explicite |
| Mémoire lors de la finalisation | Élevée | Stream + hash incrémental ; test RSS à 100 MiB |
| Course de versions | Élevée | Transaction, verrou de ligne, unique constraint, test concurrent |
| Objet orphelin | Moyenne | Sessions persistantes, expiration, cleanup exact, idempotence |
| URL signée divulguée | Élevée | TTL <=60 s, jamais loggée/persistée, autorisation DB préalable |
| Uppy 6 très récent | Moyenne | Spike et versions verrouillées ; ne pas suivre `latest` sans validation |
| Verrouillage fournisseur | Moyenne | Interface minimale autour de cinq opérations, métadonnées métier hors Storage |

## 10. Final recommendation

L'architecture est techniquement cohérente avec le dépôt et les contraintes de sécurité : upload direct reprenable, bucket privé sous RLS, absence de service role, mémoire serveur bornée, intégrité SHA-256 vérifiée par streaming et versioning transactionnel applicatif.

La décision est favorable **sous deux gates de release** : disposer d'un projet Supabase configuré pour 100 MiB et réussir les benchmarks/tests manquants avant `READY_FOR_REVIEW`. Cette recommandation n'autorise aucun code de production ; le ticket amendé doit encore recevoir une approbation humaine explicite.

GO_FOR_IMPLEMENTATION
