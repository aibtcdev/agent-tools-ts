/*
 * From https://github.com/wzbg/base58check
 * @Author: zyc
 * @Date:   2016-09-11 23:36:05
 */
'use strict';

import { sha256 } from '@noble/hashes/sha256';
import { hexToBytes } from '@noble/hashes/utils';
import * as basex from 'base-x';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function encode(data: string | Uint8Array, prefix: string | Uint8Array = '00') {
  const dataBytes = typeof data === 'string' ? hexToBytes(data) : data;
  const prefixBytes = typeof prefix === 'string' ? hexToBytes(prefix) : data;

  if (!(dataBytes instanceof Uint8Array) || !(prefixBytes instanceof Uint8Array)) {
    throw new TypeError('Argument must be of type Uint8Array or string');
  }

  const checksum = sha256(sha256(new Uint8Array([...prefixBytes, ...dataBytes])));
  return basex(ALPHABET).encode([...prefixBytes, ...dataBytes, ...checksum.slice(0, 4)]);
}

export function decode(string: string) {
  const bytes = basex(ALPHABET).decode(string);
  const prefixBytes = bytes.slice(0, 1);
  const dataBytes = bytes.slice(1, -4);

  // todo: for better performance replace spread with `concatBytes` method
  const checksum = sha256(sha256(new Uint8Array([...prefixBytes, ...dataBytes])));
  bytes.slice(-4).forEach((check, index) => {
    if (check !== checksum[index]) {
      throw new Error('Invalid checksum');
    }
  });
  return { prefix: prefixBytes, data: dataBytes };
}
