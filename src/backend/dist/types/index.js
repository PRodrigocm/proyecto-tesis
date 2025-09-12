"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalStatus = exports.AttendanceStatus = exports.SessionType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["ADMINISTRATIVO"] = "ADMINISTRATIVO";
    UserRole["DOCENTE"] = "DOCENTE";
    UserRole["APODERADO"] = "APODERADO";
})(UserRole || (exports.UserRole = UserRole = {}));
var SessionType;
(function (SessionType) {
    SessionType["AM"] = "AM";
    SessionType["PM"] = "PM";
})(SessionType || (exports.SessionType = SessionType = {}));
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENTE"] = "presente";
    AttendanceStatus["AUSENTE"] = "ausente";
    AttendanceStatus["TARDANZA"] = "tardanza";
    AttendanceStatus["JUSTIFICADO"] = "justificado";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["REPORTADO"] = "reportado";
    WithdrawalStatus["CONTACTADO"] = "contactado";
    WithdrawalStatus["EN_PROCESO"] = "en_proceso";
    WithdrawalStatus["ENTREGADO"] = "entregado";
    WithdrawalStatus["CANCELADO"] = "cancelado";
})(WithdrawalStatus || (exports.WithdrawalStatus = WithdrawalStatus = {}));
//# sourceMappingURL=index.js.map