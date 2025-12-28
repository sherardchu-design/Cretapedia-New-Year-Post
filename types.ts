export enum CharacterName {
  PIPI = '皮皮',
  SHANDIAN = '闪电',
  TANGTANG = '糖糖',
  ZACK = 'Zack',
  BADOU = '八斗'
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  posterUrl: string | null;
}

export interface DifyFileUploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

export interface DifyWorkflowResponse {
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: {
      poster_url: string;
      [key: string]: any;
    };
    error: any;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}