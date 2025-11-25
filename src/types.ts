// src/types.ts

import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// 1. Authentication
export interface RegisterCommand {
  email: string;
  password: string;
}

export interface RegisterResponseDto {
  id: string;
  email: string;
  created_at: string;
}

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  access_token: string;
  expires_in: number;
}

export interface ForgotPasswordCommand {
  email: string;
}

export interface ForgotPasswordResponseDto {
  message: string;
}

export interface ResetPasswordCommand {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponseDto {
  message: string;
}

// 2. Generation Sessions
export type CreateGenerationSessionCommand = Pick<TablesInsert<"ai_generation_sessions">, "input_text"> & {
  model?: string;
};

export interface CandidateCreateDto {
  front: string;
  back: string;
  prompt: string;
}

export type CandidateDto = Pick<Tables<"flashcards">, "id" | "front" | "back" | "prompt">;

export interface GenerationSessionResponseDto {
  id: string;
  candidates: CandidateCreateDto[];
  input_text_hash: string;
}

export type GetCandidatesResponseDto = CandidateDto[];

export interface CandidateActionCommand {
  actions: {
    candidate_id: string;
    action: "accept" | "edit" | "reject";
    edited_front?: string;
    edited_back?: string;
  }[];
}

export interface CandidateActionResponseDto {
  accepted: string[];
  edited: string[];
  rejected: string[];
}

// 3. Flashcards
export type FlashcardDto = Tables<"flashcards">;

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
}

export interface ListFlashcardsResponseDto {
  data: FlashcardDto[];
  pagination: PaginationDto;
}

export type CreateFlashcardCommand = Pick<TablesInsert<"flashcards">, "front" | "back" | "source"> & {
  ai_session_id?: string; // Optional UUID string, omit for manual flashcards
};

export type UpdateFlashcardCommand = Partial<Pick<TablesUpdate<"flashcards">, "front" | "back">>;

export type BulkCreateFlashcardsCommand = CreateFlashcardCommand[];

export interface BulkCreateFlashcardsResponseDto {
  created: FlashcardDto[];
}

export interface BulkDeleteFlashcardsCommand {
  ids: string[];
}

export interface BulkDeleteFlashcardsResponseDto {
  deleted: number;
}

// 4. Reviews
export type ReviewDto = Tables<"reviews">;

export interface ListReviewsResponseDto {
  data: ReviewDto[];
  pagination: PaginationDto;
}

export type CreateReviewCommand = Pick<TablesInsert<"reviews">, "flashcard_id" | "rating">;

// 5. Learning Session
export interface LearningSessionItemDto {
  flashcard_id: string;
  front: string;
}

export type SubmitLearningResponsesCommand = {
  flashcard_id: string;
  rating: number;
}[];

export type LearningSessionResponseDto = ReviewDto[];

// 6. Event Logs
export type EventLogDto = Tables<"event_logs">;

export type CreateEventLogCommand = Omit<TablesInsert<"event_logs">, "id" | "created_at" | "user_id">;

// 7. Flashcard Forms
export interface CreateFlashcardFormValues {
  front: string; // ≤200 chars
  back: string; // ≤500 chars
}

export interface ValidationErrors {
  front?: string; // message if invalid
  back?: string;
}

// 8. My Flashcards View Types
export interface SearchParams {
  search: string; // Search query (max 100 chars)
  page: number; // Current page (1-indexed)
  limit: number; // Items per page (10 for this view)
  sort: "created_at" | "front"; // Sort field
}

export interface EditorState {
  isOpen: boolean; // Whether dialog is open
  flashcard: FlashcardDto | null; // Flashcard being edited
  front: string; // Current front value in form
  back: string; // Current back value in form
  errors: ValidationErrors; // Field-specific errors
  isSubmitting: boolean; // Whether form is being submitted
}

export interface DeleteConfirmState {
  isOpen: boolean; // Whether dialog is open
  flashcard: FlashcardDto | null; // Flashcard to delete
  isDeleting: boolean; // Whether deletion is in progress
}

export interface BulkDeleteConfirmState {
  isOpen: boolean; // Whether dialog is open
  isDeleting: boolean; // Whether bulk deletion is in progress
}

export interface SelectionState {
  selectedIds: Set<string>; // Set of selected flashcard IDs
}

export interface FlashcardsState {
  flashcards: FlashcardDto[]; // Current page of flashcards
  pagination: PaginationDto; // Pagination metadata
  searchParams: SearchParams; // Current search and pagination params
  isLoading: boolean; // Whether data is being fetched
  error: string | null; // Error message if fetch failed
}
