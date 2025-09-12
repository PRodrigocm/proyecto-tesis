"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDNIFromQR = exports.validateQRFormat = exports.generateQRImage = exports.generateQRFromDNI = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const generateQRFromDNI = (dni) => {
    return `QR-${dni}`;
};
exports.generateQRFromDNI = generateQRFromDNI;
const generateQRImage = async (qrCode) => {
    try {
        const qrImageUrl = await qrcode_1.default.toDataURL(qrCode, {
            errorCorrectionLevel: 'M',
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return qrImageUrl;
    }
    catch (error) {
        console.error('Error generating QR image:', error);
        throw new Error('Failed to generate QR image');
    }
};
exports.generateQRImage = generateQRImage;
const validateQRFormat = (qr) => {
    const qrPattern = /^QR-\d{8}$/;
    return qrPattern.test(qr);
};
exports.validateQRFormat = validateQRFormat;
const extractDNIFromQR = (qr) => {
    if (!(0, exports.validateQRFormat)(qr)) {
        return null;
    }
    return qr.replace('QR-', '');
};
exports.extractDNIFromQR = extractDNIFromQR;
//# sourceMappingURL=qr.js.map