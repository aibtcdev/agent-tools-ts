"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreconditionFailedError = exports.PayloadTooLargeError = exports.ValidationError = exports.BadPathError = exports.NotEnoughProofError = exports.ConflictError = exports.DoesNotExist = exports.GaiaHubError = exports.NoSessionDataError = exports.InvalidStateError = exports.FailedDecryptionError = exports.SignatureVerificationError = exports.LoginFailedError = exports.InvalidAmountError = exports.NotEnoughFundsError = exports.InvalidDIDError = exports.RemoteServiceError = exports.MissingParameterError = exports.InvalidParameterError = exports.BlockstackError = exports.ERROR_CODES = void 0;
exports.ERROR_CODES = {
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
Object.freeze(exports.ERROR_CODES);
class BlockstackError extends Error {
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
exports.BlockstackError = BlockstackError;
class InvalidParameterError extends BlockstackError {
    constructor(parameter, message = '') {
        super({ code: exports.ERROR_CODES.MISSING_PARAMETER, message, parameter });
        this.name = 'MissingParametersError';
    }
}
exports.InvalidParameterError = InvalidParameterError;
class MissingParameterError extends BlockstackError {
    constructor(parameter, message = '') {
        super({ code: exports.ERROR_CODES.MISSING_PARAMETER, message, parameter });
        this.name = 'MissingParametersError';
    }
}
exports.MissingParameterError = MissingParameterError;
class RemoteServiceError extends BlockstackError {
    constructor(response, message = '') {
        super({ code: exports.ERROR_CODES.REMOTE_SERVICE_ERROR, message });
        this.response = response;
    }
}
exports.RemoteServiceError = RemoteServiceError;
class InvalidDIDError extends BlockstackError {
    constructor(message = '') {
        super({ code: exports.ERROR_CODES.INVALID_DID_ERROR, message });
        this.name = 'InvalidDIDError';
    }
}
exports.InvalidDIDError = InvalidDIDError;
class NotEnoughFundsError extends BlockstackError {
    constructor(leftToFund) {
        const message = `Not enough UTXOs to fund. Left to fund: ${leftToFund}`;
        super({ code: exports.ERROR_CODES.NOT_ENOUGH_FUNDS_ERROR, message });
        this.leftToFund = leftToFund;
        this.name = 'NotEnoughFundsError';
        this.message = message;
    }
}
exports.NotEnoughFundsError = NotEnoughFundsError;
class InvalidAmountError extends BlockstackError {
    constructor(fees, specifiedAmount) {
        const message = `Not enough coin to fund fees transaction fees. Fees would be ${fees},` +
            ` specified spend is  ${specifiedAmount}`;
        super({ code: exports.ERROR_CODES.INVALID_AMOUNT_ERROR, message });
        this.specifiedAmount = specifiedAmount;
        this.fees = fees;
        this.name = 'InvalidAmountError';
        this.message = message;
    }
}
exports.InvalidAmountError = InvalidAmountError;
class LoginFailedError extends BlockstackError {
    constructor(reason) {
        const message = `Failed to login: ${reason}`;
        super({ code: exports.ERROR_CODES.LOGIN_FAILED_ERROR, message });
        this.message = message;
        this.name = 'LoginFailedError';
    }
}
exports.LoginFailedError = LoginFailedError;
class SignatureVerificationError extends BlockstackError {
    constructor(reason) {
        const message = `Failed to verify signature: ${reason}`;
        super({ code: exports.ERROR_CODES.SIGNATURE_VERIFICATION_ERROR, message });
        this.message = message;
        this.name = 'SignatureVerificationError';
    }
}
exports.SignatureVerificationError = SignatureVerificationError;
class FailedDecryptionError extends BlockstackError {
    constructor(message = 'Unable to decrypt cipher object.') {
        super({ code: exports.ERROR_CODES.FAILED_DECRYPTION_ERROR, message });
        this.message = message;
        this.name = 'FailedDecryptionError';
    }
}
exports.FailedDecryptionError = FailedDecryptionError;
class InvalidStateError extends BlockstackError {
    constructor(message) {
        super({ code: exports.ERROR_CODES.INVALID_STATE, message });
        this.message = message;
        this.name = 'InvalidStateError';
    }
}
exports.InvalidStateError = InvalidStateError;
class NoSessionDataError extends BlockstackError {
    constructor(message) {
        super({ code: exports.ERROR_CODES.INVALID_STATE, message });
        this.message = message;
        this.name = 'NoSessionDataError';
    }
}
exports.NoSessionDataError = NoSessionDataError;
class GaiaHubError extends BlockstackError {
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
exports.GaiaHubError = GaiaHubError;
class DoesNotExist extends GaiaHubError {
    constructor(message, response) {
        super({ message, code: exports.ERROR_CODES.DOES_NOT_EXIST }, response);
        this.name = 'DoesNotExist';
    }
}
exports.DoesNotExist = DoesNotExist;
class ConflictError extends GaiaHubError {
    constructor(message, response) {
        super({ message, code: exports.ERROR_CODES.CONFLICT_ERROR }, response);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class NotEnoughProofError extends GaiaHubError {
    constructor(message, response) {
        super({ message, code: exports.ERROR_CODES.NOT_ENOUGH_PROOF_ERROR }, response);
        this.name = 'NotEnoughProofError';
    }
}
exports.NotEnoughProofError = NotEnoughProofError;
class BadPathError extends GaiaHubError {
    constructor(message, response) {
        super({ message, code: exports.ERROR_CODES.BAD_PATH_ERROR }, response);
        this.name = 'BadPathError';
    }
}
exports.BadPathError = BadPathError;
class ValidationError extends GaiaHubError {
    constructor(message, response) {
        super({ message, code: exports.ERROR_CODES.VALIDATION_ERROR }, response);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class PayloadTooLargeError extends GaiaHubError {
    constructor(message, response, maxUploadByteSize) {
        super({ message, code: exports.ERROR_CODES.PAYLOAD_TOO_LARGE_ERROR }, response);
        this.name = 'PayloadTooLargeError';
        this.maxUploadByteSize = maxUploadByteSize;
    }
}
exports.PayloadTooLargeError = PayloadTooLargeError;
class PreconditionFailedError extends GaiaHubError {
    constructor(message, response) {
        super({ message, code: exports.ERROR_CODES.PRECONDITION_FAILED_ERROR }, response);
        this.name = 'PreconditionFailedError';
    }
}
exports.PreconditionFailedError = PreconditionFailedError;
//# sourceMappingURL=errors.js.map