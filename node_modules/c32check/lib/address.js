"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.c32ToB58 = exports.b58ToC32 = exports.c32addressDecode = exports.c32address = exports.versions = void 0;
const checksum_1 = require("./checksum");
const base58check = require("./base58check");
const utils_1 = require("@noble/hashes/utils");
exports.versions = {
    mainnet: {
        p2pkh: 22,
        p2sh: 20, // 'M'
    },
    testnet: {
        p2pkh: 26,
        p2sh: 21, // 'N'
    },
};
// address conversion : bitcoin to stacks
const ADDR_BITCOIN_TO_STACKS = {};
ADDR_BITCOIN_TO_STACKS[0] = exports.versions.mainnet.p2pkh;
ADDR_BITCOIN_TO_STACKS[5] = exports.versions.mainnet.p2sh;
ADDR_BITCOIN_TO_STACKS[111] = exports.versions.testnet.p2pkh;
ADDR_BITCOIN_TO_STACKS[196] = exports.versions.testnet.p2sh;
// address conversion : stacks to bitcoin
const ADDR_STACKS_TO_BITCOIN = {};
ADDR_STACKS_TO_BITCOIN[exports.versions.mainnet.p2pkh] = 0;
ADDR_STACKS_TO_BITCOIN[exports.versions.mainnet.p2sh] = 5;
ADDR_STACKS_TO_BITCOIN[exports.versions.testnet.p2pkh] = 111;
ADDR_STACKS_TO_BITCOIN[exports.versions.testnet.p2sh] = 196;
/**
 * Make a c32check address with the given version and hash160
 * The only difference between a c32check string and c32 address
 * is that the letter 'S' is pre-pended.
 * @param {number} version - the address version number
 * @param {string} hash160hex - the hash160 to encode (must be a hash160)
 * @returns {string} the address
 */
function c32address(version, hash160hex) {
    if (!hash160hex.match(/^[0-9a-fA-F]{40}$/)) {
        throw new Error('Invalid argument: not a hash160 hex string');
    }
    const c32string = (0, checksum_1.c32checkEncode)(version, hash160hex);
    return `S${c32string}`;
}
exports.c32address = c32address;
/**
 * Decode a c32 address into its version and hash160
 * @param {string} c32addr - the c32check-encoded address
 * @returns {[number, string]} a tuple with the version and hash160
 */
function c32addressDecode(c32addr) {
    if (c32addr.length <= 5) {
        throw new Error('Invalid c32 address: invalid length');
    }
    if (c32addr[0] != 'S') {
        throw new Error('Invalid c32 address: must start with "S"');
    }
    return (0, checksum_1.c32checkDecode)(c32addr.slice(1));
}
exports.c32addressDecode = c32addressDecode;
/*
 * Convert a base58check address to a c32check address.
 * Try to convert the version number if one is not given.
 * @param {string} b58check - the base58check encoded address
 * @param {number} version - the version number, if not inferred from the address
 * @returns {string} the c32 address with the given version number (or the
 *   semantically-equivalent c32 version number, if not given)
 */
function b58ToC32(b58check, version = -1) {
    const addrInfo = base58check.decode(b58check);
    const hash160String = (0, utils_1.bytesToHex)(addrInfo.data);
    const addrVersion = parseInt((0, utils_1.bytesToHex)(addrInfo.prefix), 16);
    let stacksVersion;
    if (version < 0) {
        stacksVersion = addrVersion;
        if (ADDR_BITCOIN_TO_STACKS[addrVersion] !== undefined) {
            stacksVersion = ADDR_BITCOIN_TO_STACKS[addrVersion];
        }
    }
    else {
        stacksVersion = version;
    }
    return c32address(stacksVersion, hash160String);
}
exports.b58ToC32 = b58ToC32;
/*
 * Convert a c32check address to a base58check address.
 * @param {string} c32string - the c32check address
 * @param {number} version - the version number, if not inferred from the address
 * @returns {string} the base58 address with the given version number (or the
 *    semantically-equivalent bitcoin version number, if not given)
 */
function c32ToB58(c32string, version = -1) {
    const addrInfo = c32addressDecode(c32string);
    const stacksVersion = addrInfo[0];
    const hash160String = addrInfo[1];
    let bitcoinVersion;
    if (version < 0) {
        bitcoinVersion = stacksVersion;
        if (ADDR_STACKS_TO_BITCOIN[stacksVersion] !== undefined) {
            bitcoinVersion = ADDR_STACKS_TO_BITCOIN[stacksVersion];
        }
    }
    else {
        bitcoinVersion = version;
    }
    let prefix = bitcoinVersion.toString(16);
    if (prefix.length === 1) {
        prefix = `0${prefix}`;
    }
    return base58check.encode(hash160String, prefix);
}
exports.c32ToB58 = c32ToB58;
