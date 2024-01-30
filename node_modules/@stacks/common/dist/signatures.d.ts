export declare function parseRecoverableSignatureVrs(signature: string): {
    recoveryId: number;
    r: string;
    s: string;
};
export declare function signatureVrsToRsv(signature: string): string;
export declare function signatureRsvToVrs(signature: string): string;
