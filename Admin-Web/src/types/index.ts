/**
 * Shared TypeScript interfaces for the FieldOps Admin application
 */

// Authentication
export type Profile = "ADMINISTRADOR" | "SUPERVISOR" | "TECNICO";

export interface Session {
  userId: string;
  name: string;
  email: string;
  profile: Profile;
}

// Users
export type UserStatus = "ATIVO" | "INATIVO" | "BLOQUEADO";

export interface User {
  id: string;
  name: string;
  email: string;
  profile: Profile;
  status: UserStatus;
  createdAt: string;
}

// Master Data
export interface Client {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface Site {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  active: boolean;
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  qrCode: string;
  siteId: string;
  siteName: string;
  clientId: string;
  clientName: string;
  active: boolean;
  createdAt: string;
}

// Templates
export type TemplateStatus = "RASCUNHO" | "PUBLICADO";
export type ResponseType =
  | "TEXT"
  | "NUMERIC"
  | "DATE"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "BOOLEAN";

export interface TemplateOption {
  id: string;
  label: string;
  order: number;
}

export interface TemplateItem {
  id: string;
  label: string;
  responseType: ResponseType;
  options?: TemplateOption[];
  required: boolean;
  allowObservation: boolean;
  requireEvidenceOnNonConformity: boolean;
  order: number;
}

export interface TemplateSection {
  id: string;
  title: string;
  order: number;
  items: TemplateItem[];
}

export interface Template {
  id: string;
  title: string;
  status: TemplateStatus;
  version: number;
  sections: TemplateSection[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBy?: string;
}

// Inspections
export type InspectionStatus =
  | "RASCUNHO"
  | "ATRIBUÍDA"
  | "EM_ANDAMENTO"
  | "ENVIADA"
  | "EM_REVISÃO"
  | "APROVADA"
  | "REPROVADA"
  | "CANCELADA";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Inspection {
  id: string;
  templateId: string;
  templateTitle: string;
  clientId: string;
  clientName: string;
  siteId: string;
  siteName: string;
  equipmentId: string;
  equipmentName: string;
  technicianId: string;
  technicianName: string;
  priority: Priority;
  status: InspectionStatus;
  scheduledDate: string;
  completedAt?: string;
  progressPercent?: number;
  createdAt: string;
}

export interface InspectionListParams {
  startDate: string;
  endDate: string;
  status?: InspectionStatus;
  technicianId?: string;
  clientId?: string;
  priority?: Priority;
  overdue?: boolean;
  page: number;
  size: number;
  sort?: string;
}

// Inspection Review
export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  uploadedAt: string;
}

export interface ItemResponse {
  itemId: string;
  itemLabel: string;
  responseType: ResponseType;
  value: string | null;
  observation?: string;
  photos: Photo[];
  nonConformity?: NonConformity;
}

export interface SectionResponse {
  sectionId: string;
  sectionTitle: string;
  items: ItemResponse[];
}

export interface ReviewHistoryEntry {
  reviewerName: string;
  timestamp: string;
  decision: "APROVADA" | "REPROVADA";
  reason?: string;
}

export interface InspectionDetail extends Inspection {
  sections: SectionResponse[];
  geolocation?: { lat: number; lng: number };
  reviewHistory: ReviewHistoryEntry[];
}

// Non-Conformities
export type CriticalityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface NonConformity {
  id: string;
  inspectionId: string;
  inspectionRef: string;
  equipmentName: string;
  itemDescription: string;
  criticalityLevel: CriticalityLevel;
  evidenceCount: number;
  photos: Photo[];
}

// Pagination
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}
