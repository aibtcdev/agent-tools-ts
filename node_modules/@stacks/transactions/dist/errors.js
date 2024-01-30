"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationError = exports.SigningError = exports.NotImplementedError = exports.NoEstimateAvailableError = exports.DeserializationError = exports.SerializationError = void 0;
class TransactionError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = this.constructor.name;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
class SerializationError extends TransactionError {
    constructor(message) {
        super(message);
    }
}
exports.SerializationError = SerializationError;
class DeserializationError extends TransactionError {
    constructor(message) {
        super(message);
    }
}
exports.DeserializationError = DeserializationError;
class NoEstimateAvailableError extends TransactionError {
    constructor(message) {
        super(message);
    }
}
exports.NoEstimateAvailableError = NoEstimateAvailableError;
class NotImplementedError extends TransactionError {
    constructor(message) {
        super(message);
    }
}
exports.NotImplementedError = NotImplementedError;
class SigningError extends TransactionError {
    constructor(message) {
        super(message);
    }
}
exports.SigningError = SigningError;
class VerificationError extends TransactionError {
    constructor(message) {
        super(message);
    }
}
exports.VerificationError = VerificationError;
//# sourceMappingURL=errors.js.map