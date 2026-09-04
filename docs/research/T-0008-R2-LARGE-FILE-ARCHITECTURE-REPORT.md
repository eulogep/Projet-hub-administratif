# T-0008 R2 LARGE-FILE ARCHITECTURE REPORT

Date : 2026-09-02
Audience : validation humaine préalable à T-0008 — Private Documents
Décision recherchée : architecture R2 primaire pour des versions jusqu'à 500 MiB
État : recherche uniquement — aucune implémentation de production autorisée

## Réponse exécutive

L'architecture recommandée est : **Uppy 6 `@uppy/aws-s3` dans le navigateur, opérations S3 multipart présignées par Next.js, objets privés dans Cloudflare R2, métadonnées et autorisation dans PostgreSQL/Supabase, finalisation serveur par `HeadObject` puis lecture streaming pour magic bytes et SHA-256**.

R2 conserve seulement les octets. PostgreSQL demeure la source de vérité. Aucun identifiant R2 durable ne va dans le navigateur, aucun objet n'est public, aucun fichier ne traverse Next.js pendant l'upload et aucune version n'est rendue valide avant la vérification serveur.

La faisabilité documentaire est confirmée. Les tests R2 réels ne sont pas exécutables aujourd'hui : le dépôt ne contient — à juste titre — ni compte, ni bucket, ni credentials R2. Le plafond de 500 MiB reste donc une **cible d'implémentation**, pas une capacité produit annoncée, jusqu'au passage du large-file gate.

## 1. Current Cloudflare R2 limits

La page officielle [R2 Limits](https://developers.cloudflare.com/r2/platform/limits/) indique, mise à jour le 8 juin 2026 :

| Limite | Valeur officielle | Impact T-0008 |
| --- | ---: | --- |
| Taille d'objet | 5 TiB, techniquement 5 GiB de moins | 500 MiB est très inférieur au plafond |
| Upload en une requête | 5 GiB, techniquement 5 MiB de moins | Possible, mais non reprenable |
| Upload multipart | 4,995 TiB | Permet une évolution multi-Go sans changer le domaine |
| Taille d'une partie | 5 MiB à 5 GiB | La dernière partie peut être plus petite |
| Nombre de parties | 10 000 | 32 parties seulement à 500 MiB avec 16 MiB |
| Taille d'une clé | 1 024 octets | Le format UUID proposé est largement inférieur |
| Métadonnées objet | 8 192 octets | Ne pas y dupliquer la donnée métier |
| Écritures concurrentes sur une même clé | 1/s | Une clé neuve et immuable par version évite le conflit |

La documentation [Upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/), mise à jour le 29 juillet 2026, recommande le PUT unique pour les petits/moyens objets, et le multipart pour les gros objets ou lorsque parallélisme et reprise sont requis. Toutes les parties sauf la dernière doivent avoir la même taille. Les opérations `CreateMultipartUpload`, `UploadPart`, `ListParts`, `CompleteMultipartUpload` et `AbortMultipartUpload` sont actuellement supportées par l'[API S3 compatible R2](https://developers.cloudflare.com/r2/api/s3/api/).

R2 chiffre automatiquement objets et métadonnées au repos en AES-256-GCM et protège les transferts par TLS selon sa page [Data security](https://developers.cloudflare.com/r2/reference/data-security/), mise à jour le 21 avril 2026. Pour des documents européens, créer le bucket directement avec la juridiction `eu`; cette juridiction garantit stockage et traitement dans l'UE et ne peut plus être changée après création ([Data location](https://developers.cloudflare.com/r2/reference/data-location/), mise à jour le 19 août 2026).

## 2. R2 pricing/free-tier findings

Selon [R2 Pricing](https://developers.cloudflare.com/r2/pricing/), mise à jour le 7 août 2026, le stockage Standard coûte 0,015 USD/GB-mois, les opérations de classe A 4,50 USD/million, les opérations de classe B 0,36 USD/million, et l'egress Internet est gratuit. Le free tier mensuel Standard comprend 10 GB-mois, 1 million d'opérations A, 10 millions d'opérations B et l'egress gratuit.

- Classe A : `CreateMultipartUpload`, `UploadPart`, `ListParts`, `CompleteMultipartUpload`.
- Classe B : `HeadObject`, `GetObject`.
- Gratuites : `AbortMultipartUpload`, `DeleteObject`.
- Un fichier de 500 MiB découpé en 16 MiB produit 32 `UploadPart`, plus create et complete : **34 opérations A**, hors éventuel `ListParts` de reprise.
- La finalisation ajoute au minimum un HEAD et un GET complet ; la validation séparée par range ajoute un second GET.

Le stockage Standard est retenu. Infrequent Access ajoute un coût de récupération et une durée minimale facturée de 30 jours, mal adaptés aux remplacements et téléchargements imprévisibles de ce module.

## 3. Multipart API lifecycle

Flux retenu :

```text
CreateMultipartUpload -> UploadPart(1..N) -> CompleteMultipartUpload
                                      \-> AbortMultipartUpload en échec/annulation
```

- `CreateMultipartUpload` retourne un `uploadId` attaché à une clé.
- Chaque `UploadPart` porte un `partNumber` entre 1 et N et retourne un `ETag`.
- La complétion transmet le manifeste ordonné `{ PartNumber, ETag }[]`.
- `ListParts` permet de retrouver les parties déjà reçues et d'éviter de les renvoyer après interruption.
- `AbortMultipartUpload` libère les parties incomplètes ; R2 applique aussi par défaut une expiration à sept jours aux multipart non terminés ([Object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/), mise à jour le 21 avril 2026).

L'ETag final multipart n'est pas un SHA-256 du fichier : Cloudflare le décrit comme le hash des MD5 binaires des parties, suffixé par leur nombre. Il est conservé pour le diagnostic fournisseur, jamais comme preuve d'intégrité métier.

## 4. Uppy integration options

La documentation actuelle [Uppy AWS S3](https://uppy.io/docs/aws-s3/) confirme que `@uppy/aws-s3` cible directement S3 ou un fournisseur compatible comme R2. Uppy 6 propose trois modes exclusifs :

| Mode | Analyse | Décision |
| --- | --- | --- |
| `signRequest` | Next.js présigne chaque opération ; aucune credential n'arrive dans le navigateur | **Retenu** |
| `getCredentials` | Le navigateur reçoit des credentials temporaires et signe localement | Rejeté pour T-0008 : blast radius supérieur |
| Companion | Nécessite un service supplémentaire, utile surtout aux sources distantes | Hors scope |

Les six anciens callbacks Uppy 5 ont été remplacés en Uppy 6 par un unique `signRequest`; Uppy exécute désormais lui-même les appels S3 et le backend ne fait que présigner ([guide de migration](https://uppy.io/docs/guides/migration-guides/)). Les opérations demandées sont PUT simple, POST create, PUT part, GET list, POST complete et DELETE abort.

Choix produit :

- `<= 5 MiB` : PUT unique, car Uppy/R2 n'acceptent pas un multipart en dessous du minimum.
- `> 5 MiB` et `<= DOCUMENT_MAX_FILE_SIZE_BYTES` : multipart avec `shouldUseMultipart`.
- `getChunkSize`: 16 MiB constant, sauf dernière partie.
- Une seule sélection de fichier par session T-0008 ; pas de bulk upload.
- Retry borné : `[0, 1000, 3000, 7000]`, puis erreur explicite et bouton Réessayer.

Limitation importante : la documentation Uppy 6 indique que les parties d'un même fichier sont actuellement envoyées l'une après l'autre. R2 sait paralléliser, mais **ce rapport ne revendique pas de parallélisme intra-fichier avec Uppy 6**. La fiabilité et l'intégration maintenue priment. Le large-file gate devra mesurer le débit à 500 MiB ; si le résultat est insuffisant, toute substitution par un contrôleur parallèle personnalisé exigera une nouvelle décision humaine.

## 5. AWS SDK packages required

Le SDK reste exclusivement serveur. Les imports utilisent le client minimal et les commandes nommées, conformément à l'architecture modulaire du [SDK JavaScript v3](https://github.com/aws/aws-sdk-js-v3).

Requis :

- `@aws-sdk/client-s3@3.1121.0`
- `@aws-sdk/s3-request-presigner@3.1121.0`

Commandes nécessaires : `PutObjectCommand`, `CreateMultipartUploadCommand`, `UploadPartCommand`, `ListPartsCommand`, `CompleteMultipartUploadCommand`, `AbortMultipartUploadCommand`, `HeadObjectCommand`, `GetObjectCommand` et `DeleteObjectCommand`.

`@aws-sdk/lib-storage` n'est pas requis : il sert aux uploads pilotés par le serveur, alors que les octets vont directement du navigateur vers R2. Les paquets AWS SDK v3 sont activement maintenus, publiés très fréquemment, compatibles Node >=20 pour cette génération et sous Apache-2.0. Ils ne doivent jamais être importés depuis un composant client.

## 6. Authentication/presigning model

Architecture retenue :

1. Le serveur authentifie la session Supabase, résout le workspace et valide document, type, nom et taille.
2. Il crée `document_upload_sessions` et génère la clé opaque `{workspace_id}/{document_id}/{version_uuid}.{ext}`.
3. Uppy appelle un endpoint de signature avec l'identifiant de session et la description `signRequest`.
4. Le serveur recharge la session sous RLS et **ignore toute clé ou bucket arbitraire** : clé et bucket viennent de la session DB.
5. Il n'autorise que l'opération compatible avec l'état, vérifie `uploadId` et borne `partNumber` au nombre attendu.
6. Il retourne une URL présignée pour cette opération exacte. Le navigateur ne reçoit jamais `R2_ACCESS_KEY_ID` ni `R2_SECRET_ACCESS_KEY`.

Le premier `uploadId` observé après la création est lié atomiquement à la session ; tout autre identifiant est ensuite refusé. Une clé est unique à la session, donc un uploadId d'une autre clé ne permet pas une opération utile. Finalisation, download et cleanup refont toujours l'autorisation PostgreSQL ; connaître une clé ne suffit jamais.

TTL recommandé : 60 secondes pour create/list/complete/abort, 15 minutes pour une partie de 16 MiB afin de tolérer une connexion lente, régénérable par retry, et 60 secondes maximum pour GET download. Cloudflare précise qu'une URL présignée est un bearer token, réutilisable jusqu'à expiration, et que toute modification de ressource, opération, expiration ou signature produit `403 SignatureDoesNotMatch` ([Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), mise à jour le 24 avril 2026).

Le token parent R2 est un token **Object Read & Write limité au bucket exact**, jamais Admin. Cloudflare permet ce scope par bucket ([R2 API tokens](https://developers.cloudflare.com/r2/api/tokens/), mise à jour le 18 août 2026). Les secrets sont uniquement dans l'environnement serveur, sans préfixe `NEXT_PUBLIC_`, jamais en DB, log ou Git.

## 7. CORS design

Le bucket demeure privé, sans domaine public et sans anonymous listing. Configuration minimale proposée :

```json
[
  {
    "AllowedOrigins": ["https://<PRODUCTION_ORIGIN>"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag", "Location"],
    "MaxAgeSeconds": 600
  }
]
```

L'origine locale est une règle distincte uniquement dans le bucket/environnement de développement. Aucun `*`. `ETag` doit être exposé pour construire le manifeste multipart ; GET sert à `ListParts`, POST à create/complete et DELETE à abort selon Uppy. Les en-têtes réellement émis devront être observés au navigateur et ajoutés individuellement, jamais via une wildcard par défaut. Cloudflare rappelle que CORS contrôle le navigateur, pas l'autorisation de l'objet, et qu'une réponse d'URL expirée ne contient pas forcément les en-têtes CORS ([R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/), mise à jour le 31 juillet 2026).

## 8. Part-size/concurrency strategy

| Taille fichier | Chemin | Taille partie | Nombre de parties |
| ---: | --- | ---: | ---: |
| 1 MiB | PUT unique | — | 1 requête objet |
| 5 MiB | PUT unique | — | 1 requête objet |
| 25 MiB | Multipart | 16 MiB | 2 |
| 50 MiB | Multipart | 16 MiB | 4 |
| 100 MiB | Multipart | 16 MiB | 7 |
| 250 MiB | Multipart | 16 MiB | 16 |
| 500 MiB | Multipart | 16 MiB | 32 |

16 MiB limite l'amplification des opérations tout en bornant à 16 MiB la partie à retransmettre. Il est très au-dessus du minimum R2 de 5 MiB et garde le nombre de parties faible jusqu'à 500 MiB.

Concurrence initiale effective : un seul document et une seule partie active avec Uppy 6. Ne pas annoncer 3–5 parties parallèles que le plugin actuel ne documente pas. Les mesures du gate pourront justifier ultérieurement une évolution, sans toucher au modèle `documents/document_versions` ni aux clés.

## 9. SHA-256 strategy

R2 ne fournit pas, via son chemin multipart S3 documenté, un SHA-256 final fiable à substituer au contrôle métier ; son tableau de compatibilité ne supporte pas tous les en-têtes de checksum S3 et l'ETag multipart n'est pas le hash du fichier.

Finalisation retenue :

1. `HeadObject` contrôle existence et `ContentLength === expected_size`.
2. Un `GetObject` range des 4 100 premiers octets alimente `file-type@21.3.4` et la validation PDF/PNG/JPEG.
3. Un `GetObject` complet reste côté serveur et son `Body` est consommé morceau par morceau par `node:crypto.createHash('sha256')` ; aucun buffer de 500 MiB.
4. Le digest hexadécimal serveur est stocké dans la version immuable.

`file-type` précise que les magic bytes sont un indice best-effort, non une preuve que le fichier est sain ou bien formé. L'accord extension + MIME déclaré + signature + taille reste obligatoire, conformément à l'[OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

### Benchmark SHA-256 local réel

Mesure du 2026-09-02 sous le Node local, avec un flux synthétique déterministe réutilisant un bloc de 1 MiB. Elle mesure le coût CPU du hash incrémental et son comportement mémoire, **sans disque, réseau ni R2**.

| Taille | Durée CPU | Débit hash | Delta RSS observé |
| ---: | ---: | ---: | ---: |
| 25 MiB | 27,63 ms | 904,91 MiB/s | 0,02 MiB |
| 100 MiB | 111,46 ms | 897,16 MiB/s | 0,07 MiB |
| 250 MiB | 271,57 ms | 920,56 MiB/s | 0,12 MiB |
| 500 MiB | 541,99 ms | 922,52 MiB/s | 0,16 MiB |

Conclusion limitée : l'algorithme incrémental est bien borné en mémoire dans ce test ; en production, la durée sera dominée par le GET R2, TLS et le réseau. Seul le gate R2 réel peut valider temps et mémoire de bout en bout.

## 10. Failure/orphan strategy

Une table persistante `document_upload_sessions` est justifiée : Next.js est stateless, les opérations s'étendent sur plusieurs requêtes, et il faut lier utilisateur, workspace, clé, uploadId, expiration et nettoyage.

États : `initiated`, `uploading`, `completing`, `verifying`, `completed`, `failed`, `aborted`, `expired`.

- Retry par partie via Uppy, borné ; les parties terminées sont conservées et `ListParts` permet la reprise pendant la même sélection de fichier/session.
- Annulation : présigner `AbortMultipartUpload`, marquer `aborted`, ne créer aucune version.
- Échec permanent avant complete : abort immédiat si possible ; le lifecycle R2 sept jours est le filet de sécurité.
- Échec après complete : état `failed`, puis `DeleteObject` exclusivement sur la clé exacte de la session après vérification qu'aucune version ne la référence.
- Timeout : `expires_at`, job de réconciliation idempotent, état `expired`, abort/delete exact.
- Finalisation répétée : retourne la version déjà créée ; elle ne crée jamais un nouveau numéro.
- Aucun cleanup ne supprime par préfixe, ne touche une clé référencée, ni une ancienne version.

## 11. Security analysis

| Contrôle | Décision T-0008 |
| --- | --- |
| Authentification | Session Supabase obligatoire à chaque endpoint |
| Autorisation | Workspace/document/session rechargés sous RLS avant toute présignature |
| R2 privé | Aucun accès public, custom domain public ou listing navigateur |
| Secrets | Credentials R2 serveur uniquement ; scans Git/build/client bundle |
| Clés | UUID opaques ; nom original absent de la clé |
| Taille | `DOCUMENT_MAX_FILE_SIZE_BYTES`, contrôle avant session, HEAD après upload |
| Types | PDF/PNG/JPEG seulement ; extension, MIME, 4 100 premiers octets |
| Intégrité | SHA-256 serveur streaming ; ETag conservé mais non assimilé au SHA |
| Download | GET présigné <=60 s après double autorisation document/version |
| Rendu | `Content-Disposition: attachment`, `nosniff`, aucune preview |
| Versioning | Nouvelle clé et ligne immuable ; jamais d'overwrite |
| Concurrence | Transaction DB sous verrou ; unique `(document_id, version_number)` |
| Journalisation | IDs métier et codes d'état uniquement ; jamais URL, secret, octets, nom sensible ou clé complète |

Risque résiduel explicite : sans antivirus/CDR, un PDF polyglotte ou hostile peut passer les signatures. T-0008 limite ce risque par allowlist, téléchargement en pièce jointe et absence totale de rendu. Élargir les formats ou ajouter une preview exige un nouveau gate sécurité.

Autres blockers automatiques : CORS wildcard, URL longue/permanente, signature pour clé fournie librement par le client, course de version, buffering complet Next.js, version antérieure écrasée, credentials dans le bundle, ou document réel dans Git.

## 12. Proposed database changes

### `documents`

Conserver le modèle métier prévu : workspace et contextes optionnels, métadonnées, dates, archive logique et `current_version_number`. La contrainte `expires_on >= issued_on` s'applique lorsque les deux dates existent.

### `document_versions`

Ajouter/conserver :

- `storage_provider text not null check (storage_provider = 'cloudflare_r2')`
- `storage_bucket text not null`
- `storage_key text not null`
- `size_bytes bigint not null check (size_bytes > 0)`
- `sha256 char(64) not null`
- `etag text null`
- unicité `(workspace_id, storage_bucket, storage_key)` et `(document_id, version_number)`

Ne pas graver 500 MiB dans une contrainte SQL. Le plafond vient de la configuration serveur centrale, puis la taille réelle vérifiée est persistée. L'insertion directe de versions par le navigateur est interdite ; une fonction de finalisation contrôlée crée la version après validation.

### `document_upload_sessions`

Champs minimaux : `id`, `workspace_id`, `document_id`, `provider`, `upload_id`, `storage_bucket`, `storage_key`, `expected_size`, `expected_mime`, `state`, `expires_at`, `created_at`, `updated_at`, `completed_version_id`, `last_error_code`.

RLS sur les trois tables selon l'équivalent existant `workspace.owner_user_id = auth.uid()`. La fonction transactionnelle de finalisation verrouille le document (`SELECT ... FOR UPDATE`), calcule le prochain numéro dans ce verrou, insère la version immuable et avance le pointeur courant. Ne jamais faire un `MAX(version_number)+1` non verrouillé.

## 13. Test plan

### CI FAST

- Unit : configuration taille, clés, filename, extension/MIME/magic bytes, SHA format, états, expiration, hiérarchie et mapping Uppy -> opérations autorisées.
- DB/RLS : reset, contraintes, anon denied, isolation symétrique A/B, sessions, versions immuables, finalisation idempotente et course de remplacement.
- Intégration avec adaptateur R2 simulé : create/sign/complete/abort/head/get/delete, clés étrangères refusées, TTL et états.
- E2E petit fichier synthétique : login, upload/progression, détail, download, replace/historique, archive.
- Accessibilité : clavier, focus, statut `aria-live`, erreurs non color-only, cancel/retry, 360 px sans overflow.

### R2 SECURITY GATE

- Bucket privé EU, token limité au bucket, CORS exact.
- User A ne peut présigner document/session/clé/uploadId de B.
- URL expirée, signature modifiée, méthode modifiée et clé modifiée : refus R2.
- Faux PDF/PNG/JPEG, vide, surdimensionné, mismatch extension/MIME/magic : refus et cleanup.
- Aucun secret/URL présignée/clé complète dans logs, HTML, bundle, DB ou Git.

### LARGE FILE GATE dédié

Fichiers synthétiques seulement : 1, 5, 25, 50, 100, 250 et 500 MiB. Pour 100/250/500 : durée, débit, mémoire navigateur/serveur, parties, retry, complete, HEAD, validation, SHA et download.

Tests obligatoires : interruption réseau à 250+ MiB sans redémarrer les parties terminées ; échec artificiel d'une partie ; cancel/abort ; session expirée ; échec après complete ; deux remplacements concurrents. Le gate n'est **pas exécuté** dans cette recherche, faute d'environnement R2 autorisé. Si 500 MiB échoue, le produit reste plafonné à la plus grande taille entièrement validée et approuvée.

## 14. Exact dependencies

Après approbation seulement :

```text
@uppy/core@6.0.0
@uppy/dashboard@6.0.0
@uppy/aws-s3@6.0.0
@aws-sdk/client-s3@3.1121.0
@aws-sdk/s3-request-presigner@3.1121.0
file-type@21.3.4
```

Licences : Uppy et file-type MIT ; AWS SDK v3 Apache-2.0. `file-type@21.3.4` est choisi pour Node >=20, cohérent avec le dépôt ; la v22 exige Node >=22. Aucun `@uppy/tus`, `@aws-sdk/lib-storage`, Companion, SDK R2 supplémentaire, antivirus ou paquet de hash.

Variables serveur documentées dans `.env.example`, sans valeur sensible :

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=professional-documents
R2_ENDPOINT=
DOCUMENT_MAX_FILE_SIZE_BYTES=524288000
```

`R2_ENDPOINT` est juridictionnel pour le bucket EU : `https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com`. La configuration doit refuser de démarrer si une variable est manquante ou si le maximum n'est pas un entier positif sûr.

## 15. GO / NO-GO

La cible R2 satisfait les besoins structurels : objets privés jusqu'à plusieurs TiB, multipart S3 complet, présignature opérationnelle, retry/reprise par partie, coûts lisibles, chiffrement automatique et séparation nette entre domaine PostgreSQL et stockage d'octets.

Conditions avant implémentation :

1. approbation humaine explicite de ce rapport ;
2. bucket R2 privé, idéalement juridiction EU, et token serveur limité à ce bucket ;
3. amendement du ticket T-0008 : R2 primaire, 500 MiB configurable, session table, Uppy AWS S3, CORS et large-file gate ;
4. aucun retour silencieux vers Supabase Storage ;
5. le plafond produit publié restera égal à la plus grande taille effectivement testée et approuvée.

GO_FOR_IMPLEMENTATION

## Claim-to-source ledger

| Claim family | Source primaire | Mise à jour visible | Accès |
| --- | --- | --- | --- |
| Limites objet/parties | [Cloudflare R2 Limits](https://developers.cloudflare.com/r2/platform/limits/) | 2026-06-08 | 2026-09-02 |
| Upload/multipart/ETag | [Cloudflare Upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/) | 2026-07-29 | 2026-09-02 |
| Compatibilité S3 | [Cloudflare S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/) | page consultée courante | 2026-09-02 |
| URLs présignées | [Cloudflare Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) | 2026-04-24 | 2026-09-02 |
| Tokens/permissions | [Cloudflare R2 Authentication](https://developers.cloudflare.com/r2/api/tokens/) | 2026-08-18 | 2026-09-02 |
| CORS | [Cloudflare R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/) | 2026-07-31 | 2026-09-02 |
| Lifecycle multipart | [Cloudflare Object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/) | 2026-04-21 | 2026-09-02 |
| Tarification | [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/) | 2026-08-07 | 2026-09-02 |
| Chiffrement | [Cloudflare Data security](https://developers.cloudflare.com/r2/reference/data-security/) | 2026-04-21 | 2026-09-02 |
| Résidence des données | [Cloudflare Data location](https://developers.cloudflare.com/r2/reference/data-location/) | 2026-08-19 | 2026-09-02 |
| Plugin S3 actuel | [Uppy AWS S3](https://uppy.io/docs/aws-s3/) | documentation courante | 2026-09-02 |
| Migration Uppy 6 | [Uppy migration guides](https://uppy.io/docs/guides/migration-guides/) | documentation courante | 2026-09-02 |
| SDK/presigner | [AWS SDK v3](https://github.com/aws/aws-sdk-js-v3), [presigner API](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-request-presigner/) | version courante | 2026-09-02 |
| Sécurité upload | [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) | page courante | 2026-09-02 |
| Magic bytes | [file-type](https://github.com/sindresorhus/file-type) | dépôt courant | 2026-09-02 |
| Modèle versions | [Paperless-ngx API](https://github.com/paperless-ngx/paperless-ngx/blob/dev/docs/api.md) | branche dev courante | 2026-09-02 |
| Inspiration UX | [Papra](https://github.com/papra-hq/papra) | dépôt courant | 2026-09-02 |

Arrêt de recherche : les quinze sections ont une source primaire ou une limitation explicite ; les lacunes restantes exigent un bucket R2 réel et relèvent du gate d'implémentation, pas d'une nouvelle recherche documentaire.
