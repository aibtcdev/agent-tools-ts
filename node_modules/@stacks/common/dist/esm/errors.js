export const ERROR_CODES = {
    MISSING_PARAMETER: 'missing_parameter',
    REMOTE_SERVICE_ERROR: 'remote_service_error',
    INVALID_STATE: 'invalid_state',
    NO_SESSION_DATA: 'no_session_data',
    DOES_NOT_EXIST: 'does_not_exist',
    FAILED_DECRYPTION_ERROR: 'failed_decryption_error',
    INVALID_DID_ERROR: 'invalid_did_error',
    NOT_ENOUGH_FUNDS_ERROR: 'not_enough_error',
    INVALID_AMOUNT_ERROR: 'invalid_amount_error',
    LOGIN_FAILED_ERROR: 'login_failed',
    SIGNATURE_VERIFICATION_ERROR: 'signature_verification_failure',
    CONFLICT_ERROR: 'conflict_error',
    NOT_ENOUGH_PROOF_ERROR: 'not_enough_proof_error',
    BAD_PATH_ERROR: 'bad_path_error',
    VALIDATION_ERROR: 'validation_error',
    PAYLOAD_TOO_LARGE_ERROR: 'payload_too_large_error',
    PRECONDITION_FAILED_ERROR: 'precondition_failed_error',
    UNKNOWN: 'unknown',
};
Object.freeze(ERROR_CODES);
export class BlockstackError extends Error {
    constructor(error) {
        super();
        let message = error.message;
        let bugDetails = `Error Code: ${error.code}`;
        let stack = this.stack;
        if (!stack) {
            try {
                throw new Error();
            }
            catch (e) {
                stack = e.stack;
            }
        }
        else {
            bugDetails += `Stack Trace:\n${stack}`;
        }
        message += `\nIf you believe this exception is caused by a bug in stacks.js,
      please file a bug report: https://github.com/blockstack/stacks.js/issues\n\n${bugDetails}`;
        this.message = message;
        this.code = error.code;
        this.parameter = error.parameter ? error.parameter : undefined;
    }
    toString() {
        return `${super.toString()}
    code: ${this.code} param: ${this.parameter ? this.parameter : 'n/a'}`;
    }
}
export class InvalidParameterError extends BlockstackError {
    constructor(parameter, message = '') {
        super({ code: ERROR_CODES.MISSING_PARAMETER, message, parameter });
        this.name = 'MissingParametersError';
    }
}
export class MissingParameterError extends BlockstackError {
    constructor(parameter, message = '') {
        super({ code: ERROR_CODES.MISSING_PARAMETER, message, parameter });
        this.name = 'MissingParametersError';
    }
}
export class RemoteServiceError extends BlockstackError {
    constructor(response, message = '') {
        super({ code: ERROR_CODES.REMOTE_SERVICE_ERROR, message });
        this.response = response;
    }
}
export class InvalidDIDError extends BlockstackError {
    constructor(message = '') {
        super({ code: ERROR_CODES.INVALID_DID_ERROR, message });
        this.name = 'InvalidDIDError';
    }
}
export class NotEnoughFundsError extends BlockstackError {
    constructor(leftToFund) {
        const message = `Not enough UTXOs to fund. Left to fund: ${leftToFund}`;
        super({ code: ERROR_CODES.NOT_ENOUGH_FUNDS_ERROR, message });
        this.leftToFund = leftToFund;
        this.name = 'NotEnoughFundsError';
        this.message = message;
    }
}
export class InvalidAmountError extends BlockstackError {
    constructor(fees, specifiedAmount) {
        const message = `Not enough coin to fund fees transaction fees. Fees would be ${fees},` +
            ` specified spend is  ${specifiedAmount}`;
        super({ code: ERROR_CODES.INVALID_AMOUNT_ERROR, message });
        this.specifiedAmount = specifiedAmount;
        this.fees = fees;
        this.name = 'InvalidAmountError';
        this.message = message;
    }
}
export class LoginFailedError extends BlockstackError {
    constructor(reason) {
        const message = `Failed to login: ${reason}`;
        super({ code: ERROR_CODES.LOGIN_FAILED_ERROR, message });
        this.message = message;
        this.name = 'LoginFailedError';
    }
}
export class SignatureVerificationError extends BlockstackError {
    constructor(reason) {
        const message = `Failed to verify signature: ${reason}`;
        super({ code: ERROR_CODES.SIGNATURE_VERIFICATION_ERROR, message });
        this.message = message;
        this.name = 'SignatureVerificationError';
    }
}
export class FailedDecryptionError extends BlockstackError {
    constructor(message = 'Unable to decrypt cipher object.') {
        super({ code: ERROR_CODES.FAILED_DECRYPTION_ERROR, message });
        this.message = message;
        this.name = 'FailedDecryptionError';
    }
}
export class InvalidStateError extends BlockstackError {
    constructor(message) {
        super({ code: ERROR_CODES.INVALID_STATE, message });
        this.message = message;
        this.name = 'InvalidStateError';
    }
}
export class NoSessionDataError extends BlockstackError {
    constructor(message) {
        super({ code: ERROR_CODES.INVALID_STATE, message });
        this.message = message;
        this.name = 'NoSessionDataError';
    }
}
export class GaiaHubError extends BlockstackError {
    constructor(error, response) {
        super(error);
        if (response) {
            this.hubError = {
                statusCode: response.status,
                statusText: response.statusText,
            };
            if (typeof response.body === 'string') {
                this.hubError.message = response.body;
            }
            else if (typeof response.body === 'object') {
                Object.assign(this.hubError, response.body);
            }
        }
    }
}
export class DoesNotExist extends GaiaHubError {
    constructor(message, response) {
        super({ message, code: ERROR_CODES.DOES_NOT_EXIST }, response);
        this.name = 'DoesNotExist';
    }
}
export class ConflictError extends GaiaHubError {
    constructor(message, response) {
        super({ message, code: ERROR_CODES.CONFLICT_ERROR }, response);
        this.name = 'ConflictError';
    }
}
export class NotEnoughProofError extends GaiaHubError {
    constructor(message, response) {
        super({ message, code: ERROR_CODES.NOT_ENOUGH_PROOF_ERROR }, response);
        this.name = 'NotEnoughProofError';
    }
}
export class BadPathError extends GaiaHubError {
    constructor(message, response) {
        super({ message, code: ERROR_CODES.BAD_PATH_ERROR }, response);
        this.name = 'BadPathError';
    }
}
export class ValidationError extends GaiaHubError {
    constructor(message, response) {
        super({ message, code: ERROR_CODES.VALIDATION_ERROR }, response);
        this.name = 'ValidationError';
    }
}
export class PayloadTooLargeError extends GaiaHubError {
    constructor(message, response, maxUploadByteSize) {
        super({ message, code: ERROR_CODES.PAYLOAD_TOO_LARGE_ERROR }, response);
        this.name = 'PayloadTooLargeError';
        this.maxUploadByteSize = maxUploadByteSize;
    }
}
export class PreconditionFailedError extends GaiaHubError {
    constructor(message, response) {
        super({ message, code: ERROR_CODES.PRECONDITION_FAILED_ERROR }, response);
        this.name = 'PreconditionFailedError';
    }
}
//# sourceMappingURL=errors.js.map