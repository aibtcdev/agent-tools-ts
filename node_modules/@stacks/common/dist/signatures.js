"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signatureRsvToVrs = exports.signatureVrsToRsv = exports.parseRecoverableSignatureVrs = void 0;
const utils_1 = require("./utils");
const COORDINATE_BYTES = 32;
function parseRecoverableSignatureVrs(signature) {
    if (signature.length < COORDINATE_BYTES * 2 * 2 + 1) {
        throw new Error('Invalid signature');
    }
    const recoveryIdHex = signature.slice(0, 2);
    const r = signature.slice(2, 2 + COORDINATE_BYTES * 2);
    const s = signature.slice(2 + COORDINATE_BYTES * 2);
    return {
        recoveryId: (0, utils_1.hexToInt)(recoveryIdHex),
        r,
        s,
    };
}
exports.parseRecoverableSignatureVrs = parseRecoverableSignatureVrs;
function signatureVrsToRsv(signature) {
    return signature.slice(2) + signature.slice(0, 2);
}
exports.signatureVrsToRsv = signatureVrsToRsv;
function signatureRsvToVrs(signature) {
    return signature.slice(-2) + signature.slice(0, -2);
}
exports.signatureRsvToVrs = signatureRsvToVrs;
//# sourceMappingURL=signatures.js.map