import QRCode from 'qrcode';

/**
 * Genera un código QR único basado en el DNI del estudiante
 * Cumple con RF-23: QR único persistido generado a partir del DNI
 */
export const generateQRFromDNI = (dni: string): string => {
  return `QR-${dni}`;
};

/**
 * Genera la imagen del código QR
 */
export const generateQRImage = async (qrCode: string): Promise<string> => {
  try {
    const qrImageUrl = await QRCode.toDataURL(qrCode, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrImageUrl;
  } catch (error) {
    console.error('Error generating QR image:', error);
    throw new Error('Failed to generate QR image');
  }
};

/**
 * Valida el formato del código QR
 */
export const validateQRFormat = (qr: string): boolean => {
  const qrPattern = /^QR-\d{8}$/; // QR-12345678 (8 dígitos de DNI)
  return qrPattern.test(qr);
};

/**
 * Extrae el DNI del código QR
 */
export const extractDNIFromQR = (qr: string): string | null => {
  if (!validateQRFormat(qr)) {
    return null;
  }
  
  return qr.replace('QR-', '');
};
