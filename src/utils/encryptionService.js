// src/utils/encryptionService.js - VERSION SIMPLIFIÉE
import CryptoJS from 'crypto-js';

export const EncryptionService = {
  // 🎯 CLÉ DE CHIFFREMENT (à configurer)
  ENCRYPTION_KEY: 'tombola-secure-key-change-me-2024',
  
  // 🎯 CHIFFREMENT SIMPLE
  encrypt(data) {
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(dataString, this.ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('❌ Erreur chiffrement:', error);
      return data; // Retourne les données en clair en cas d'erreur
    }
  },

  // 🎯 DÉCHIFFREMENT SIMPLE
  decrypt(encryptedData) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      console.error('❌ Erreur déchiffrement:', error);
      return encryptedData; // Retourne les données chiffrées si échec
    }
  },

  // 🎯 VÉRIFICATION RAPIDE
  testEncryption() {
    const testData = { email: 'test@example.com', phone: '0123456789' };
    const encrypted = this.encrypt(testData);
    const decrypted = this.decrypt(encrypted);
    return JSON.stringify(testData) === JSON.stringify(decrypted);
  }
};
