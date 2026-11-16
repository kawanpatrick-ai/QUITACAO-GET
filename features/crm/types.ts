import type { Tables, TablesInsert, TablesUpdate } from '../../types/supabase';

export type ClientRow = Tables<'crm_clients'>;
export type ClientInsert = TablesInsert<'crm_clients'>;
export type ClientPatch = TablesUpdate<'crm_clients'>;

export type ClientStage =
  | 'a_analisar'
  | 'contatado'
  | 'em_negociacao'
  | 'proposta_enviada'
  | 'aguardando_resposta'
  | 'concluido'
  | 'arquivado';

export type ClientWorkflowStatus = 'ativo' | 'finalizado';
export type EvidenceStatus =
  | 'sem_validacao'
  | 'comprovante_recebido'
  | 'quitacao_verificada'
  | 'divergente';
export type PriorityLevel = 'normal' | 'alta' | 'urgente';
export type MembershipRole = 'admin' | 'operator';
export type ProcessType = 'comum' | 'busca_apreensao';
export type CompletedActivityCategory =
  | 'atendimento'
  | 'analise_processual'
  | 'auditoria'
  | 'dossie'
  | 'investigacao'
  | 'planilha'
  | 'sistema'
  | 'automacao'
  | 'outro';

export type Client = Omit<
  ClientRow,
  'stage' | 'workflow_status' | 'evidence_status' | 'priority_level'
> & {
  stage: ClientStage;
  workflow_status: ClientWorkflowStatus;
  evidence_status: EvidenceStatus;
  priority_level: PriorityLevel;
};

export type Activity = Tables<'crm_activities'>;
export type CompletedActivity = Omit<Tables<'crm_completed_activities'>, 'category'> & {
  category: CompletedActivityCategory;
};
export type Process = Tables<'crm_processes'>;
export type Institution = Tables<'crm_parties'>;
export type Membership = Omit<Tables<'crm_memberships'>, 'role'> & {
  role: MembershipRole;
};
export type ImportRun = Tables<'crm_import_runs'>;
export type SourceRow = Tables<'crm_source_rows'>;
export type UnmatchedSource = Tables<'crm_unmatched_sources'>;

export interface ClientListFilters {
  search?: string;
  stage?: ClientStage;
  workflowStatus?: ClientWorkflowStatus;
  evidenceStatus?: EvidenceStatus;
  priority?: PriorityLevel;
  assignedTo?: string;
  institution?: string;
  returnBefore?: string;
  page: number;
  pageSize: number;
}

export interface PageResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
