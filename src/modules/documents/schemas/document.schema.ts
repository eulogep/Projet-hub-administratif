import { z } from "zod";
import { DOCUMENT_ALLOWED_MIME_TYPES, hasAllowedFileIdentity } from "../policy";

const nullableText = (max: number) => z.preprocess((value) => typeof value === "string" && value.trim() === "" ? null : value, z.string().trim().min(1).max(max).nullable());
const nullableDate = z.preprocess((value) => typeof value === "string" && value.trim() === "" ? null : value, z.iso.date().nullable());
const nullableUuid = z.preprocess((value) => value === "" || value == null ? null : value, z.uuid().nullable());

export const documentCategories = ["identity", "administrative", "contract", "education", "work", "other"] as const;
export const documentStatuses = ["draft", "to_sign", "submitted", "valid", "expired", "archived"] as const;
export const documentCategoryLabels: Record<(typeof documentCategories)[number], string> = { identity: "Identité", administrative: "Administratif", contract: "Contrat", education: "Formation", work: "Travail", other: "Autre" };
export const documentStatusLabels: Record<(typeof documentStatuses)[number], string> = { draft: "Brouillon", to_sign: "À signer", submitted: "Envoyé", valid: "Valide", expired: "Expiré", archived: "Archivé" };

export const documentMetadataSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(180),
  category: z.enum(documentCategories), status: z.enum(documentStatuses),
  organization_id: nullableUuid, project_id: nullableUuid, mission_id: nullableUuid,
  issued_on: nullableDate, expires_on: nullableDate, notes: nullableText(2000),
}).superRefine((value, context) => {
  if (value.issued_on && value.expires_on && value.expires_on < value.issued_on) context.addIssue({ code: "custom", path: ["expires_on"], message: "La date d’expiration doit suivre la date d’émission." });
});

export const uploadRequestSchema = documentMetadataSchema.extend({
  document_id: z.uuid().optional(), original_file_name: z.string().trim().min(1).max(255),
  expected_size: z.number().int().positive(), expected_mime: z.enum(DOCUMENT_ALLOWED_MIME_TYPES),
}).superRefine((value, context) => {
  if (!hasAllowedFileIdentity(value.original_file_name, value.expected_mime)) context.addIssue({ code: "custom", path: ["original_file_name"], message: "L’extension et le type du fichier ne correspondent pas." });
});

export const signRequestSchema = z.object({
  method: z.enum(["GET", "PUT", "POST", "DELETE"]), key: z.string(), uploadId: z.string().min(1).optional(), partNumber: z.number().int().min(1).max(10000).optional(),
});

export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;
