export declare const c32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
/**
 * Encode a hex string as a c32 string.  Note that the hex string is assumed
 * to be big-endian (and the resulting c32 string will be as well).
 * @param {string} inputHex - the input to encode
 * @param {number} minLength - the minimum length of the c32 string
 * @returns {string} the c32check-encoded representation of the data, as a string
 */
export declare function c32encode(inputHex: string, minLength?: number): string;
export declare function c32normalize(c32input: string): string;
export declare function c32decode(c32input: string, minLength?: number): string;
