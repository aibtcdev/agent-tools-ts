"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseOkCV = exports.responseErrorCV = void 0;
const constants_1 = require("../constants");
function responseErrorCV(value) {
    return { type: constants_1.ClarityType.ResponseErr, value };
}
exports.responseErrorCV = responseErrorCV;
function responseOkCV(value) {
    return { type: constants_1.ClarityType.ResponseOk, value };
}
exports.responseOkCV = responseOkCV;
//# sourceMappingURL=responseCV.js.map