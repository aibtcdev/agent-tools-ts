export declare function encode(data: string | Uint8Array, prefix?: string | Uint8Array): string;
export declare function decode(string: string): {
    prefix: Uint8Array;
    data: Uint8Array;
};
