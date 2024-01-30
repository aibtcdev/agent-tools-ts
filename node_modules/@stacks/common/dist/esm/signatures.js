import { hexToInt } from './utils';
const COORDINATE_BYTES = 32;
export function parseRecoverableSignatureVrs(signature) {
    if (signature.length < COORDINATE_BYTES * 2 * 2 + 1) {
        throw new Error('Invalid signature');
    }
    const recoveryIdHex = signature.slice(0, 2);
    const r = signature.slice(2, 2 + COORDINATE_BYTES * 2);
    const s = signature.slice(2 + COORDINATE_BYTES * 2);
    return {
        recoveryId: hexToInt(recoveryIdHex),
        r,
        s,
    };
}
export function signatureVrsToRsv(signature) {
    return signature.slice(2) + signature.slice(0, 2);
}
export function signatureRsvToVrs(signature) {
    return signature.slice(-2) + signature.slice(0, -2);
}
//# sourceMappingURL=signatures.js.map