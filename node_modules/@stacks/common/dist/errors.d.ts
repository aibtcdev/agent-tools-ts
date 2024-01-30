export declare const ERROR_CODES: {
    MISSING_PARAMETER: string;
    REMOTE_SERVICE_ERROR: string;
    INVALID_STATE: string;
    NO_SESSION_DATA: string;
    DOES_NOT_EXIST: string;
    FAILED_DECRYPTION_ERROR: string;
    INVALID_DID_ERROR: string;
    NOT_ENOUGH_FUNDS_ERROR: string;
    INVALID_AMOUNT_ERROR: string;
    LOGIN_FAILED_ERROR: string;
    SIGNATURE_VERIFICATION_ERROR: string;
    CONFLICT_ERROR: string;
    NOT_ENOUGH_PROOF_ERROR: string;
    BAD_PATH_ERROR: string;
    VALIDATION_ERROR: string;
    PAYLOAD_TOO_LARGE_ERROR: string;
    PRECONDITION_FAILED_ERROR: string;
    UNKNOWN: string;
};
type ErrorData = {
    code: string;
    parameter?: string;
    message: string;
};
export declare class BlockstackError extends Error {
    message: string;
    code: string;
    parameter?: string;
    constructor(error: ErrorData);
    toString(): string;
}
export declare class InvalidParameterError extends BlockstackError {
    constructor(parameter: string, message?: string);
}
export declare class MissingParameterError extends BlockstackError {
    constructor(parameter: string, message?: string);
}
export declare class RemoteServiceError extends BlockstackError {
    response: Response;
    constructor(response: Response, message?: string);
}
export declare class InvalidDIDError extends BlockstackError {
    constructor(message?: string);
}
export declare class NotEnoughFundsError extends BlockstackError {
    leftToFund: number;
    constructor(leftToFund: number);
}
export declare class InvalidAmountError extends BlockstackError {
    fees: number;
    specifiedAmount: number;
    constructor(fees: number, specifiedAmount: number);
}
export declare class LoginFailedError extends BlockstackError {
    constructor(reason: string);
}
export declare class SignatureVerificationError extends BlockstackError {
    constructor(reason: string);
}
export declare class FailedDecryptionError extends BlockstackError {
    constructor(message?: string);
}
export declare class InvalidStateError extends BlockstackError {
    constructor(message: string);
}
export declare class NoSessionDataError extends BlockstackError {
    constructor(message: string);
}
export interface GaiaHubErrorResponse {
    status: number;
    statusText: string;
    body?: any;
}
export interface HubErrorDetails {
    message?: string;
    statusCode: number;
    statusText: string;
    [prop: string]: any;
}
export declare class GaiaHubError extends BlockstackError {
    hubError?: HubErrorDetails;
    constructor(error: ErrorData, response: GaiaHubErrorResponse);
}
export declare class DoesNotExist extends GaiaHubError {
    constructor(message: string, response: GaiaHubErrorResponse);
}
export declare class ConflictError extends GaiaHubError {
    constructor(message: string, response: GaiaHubErrorResponse);
}
export declare class NotEnoughProofError extends GaiaHubError {
    constructor(message: string, response: GaiaHubErrorResponse);
}
export declare class BadPathError extends GaiaHubError {
    constructor(message: string, response: GaiaHubErrorResponse);
}
export declare class ValidationError extends GaiaHubError {
    constructor(message: string, response: GaiaHubErrorResponse);
}
export declare class PayloadTooLargeError extends GaiaHubError {
    hubError?: HubErrorDetails;
    maxUploadByteSize: number;
    constructor(message: string, response: GaiaHubErrorResponse | null, maxUploadByteSize: number);
}
export declare class PreconditionFailedError extends GaiaHubError {
    constructor(message: string, response: GaiaHubErrorResponse);
}
export {};
