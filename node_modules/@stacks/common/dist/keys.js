"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privateKeyToBytes = void 0;
const utils_1 = require("./utils");
function privateKeyToBytes(privateKey) {
    const privateKeyBuffer = typeof privateKey === 'string' ? (0, utils_1.hexToBytes)(privateKey) : privateKey;
    if (privateKeyBuffer.length != 32 && privateKeyBuffer.length != 33) {
        throw new Error(`Improperly formatted private-key. Private-key byte length should be 32 or 33. Length provided: ${privateKeyBuffer.length}`);
    }
    if (privateKeyBuffer.length == 33 && privateKeyBuffer[32] !== 1) {
        throw new Error('Improperly formatted private-key. 33 bytes indicate compressed key, but the last byte must be == 01');
    }
    return privateKeyBuffer;
}
exports.privateKeyToBytes = privateKeyToBytes;
//# sourceMappingURL=keys.js.map