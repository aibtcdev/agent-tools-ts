export declare const versions: {
    mainnet: {
        p2pkh: number;
        p2sh: number;
    };
    testnet: {
        p2pkh: number;
        p2sh: number;
    };
};
/**
 * Make a c32check address with the given version and hash160
 * The only difference between a c32check string and c32 address
 * is that the letter 'S' is pre-pended.
 * @param {number} version - the address version number
 * @param {string} hash160hex - the hash160 to encode (must be a hash160)
 * @returns {string} the address
 */
export declare function c32address(version: number, hash160hex: string): string;
/**
 * Decode a c32 address into its version and hash160
 * @param {string} c32addr - the c32check-encoded address
 * @returns {[number, string]} a tuple with the version and hash160
 */
export declare function c32addressDecode(c32addr: string): [number, string];
export declare function b58ToC32(b58check: string, version?: number): string;
export declare function c32ToB58(c32string: string, version?: number): string;
