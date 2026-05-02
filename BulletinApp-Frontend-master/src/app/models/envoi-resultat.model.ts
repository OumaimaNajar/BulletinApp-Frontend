// src/app/models/envoi-resultat.model.ts
export interface ErreurDetail {
    email: string;
    raison: string;
}

export interface EnvoiResultat {
    success: boolean;
    message: string;
    total: number;
    envoyes: number;
    echecs: number;
    erreurs: ErreurDetail[];
}