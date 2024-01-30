declare class TransactionError extends Error {
    constructor(message: string);
}
export declare class SerializationError extends TransactionError {
    constructor(message: string);
}
export declare class DeserializationError extends TransactionError {
    constructor(message: string);
}
export declare class NoEstimateAvailableError extends TransactionError {
    constructor(message: string);
}
export declare class NotImplementedError extends TransactionError {
    constructor(message: string);
}
export declare class SigningError extends TransactionError {
    constructor(message: string);
}
export declare class VerificationError extends TransactionError {
    constructor(message: string);
}
export {};
