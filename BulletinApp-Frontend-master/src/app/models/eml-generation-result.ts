export interface EmlGenerationResult {
  success: boolean;
  brouillonsCrees: number;
  output: string;
  error?: string;
  dossierEml?: string;
}