// src/utils/dataProtection.js
import { EncryptionService } from './encryptionService';

export const DataProtection = {
  
  // 🎯 CHAMPS À PROTÉGER
  SENSITIVE_FIELDS: ['email', 'phone', 'name', 'address', 'paymentInfo'],
  
  // 🎯 PROTÉGER UN PARTICIPANT
  protectParticipant(participant) {
    const protectedData = { ...participant };
    
    this.SENSITIVE_FIELDS.forEach(field => {
      if (participant[field]) {
        protectedData[field] = EncryptionService.encrypt(participant[field]);
      }
    });
    
    protectedData._protected = true;
    protectedData._protectedAt = new Date().toISOString();
    
    return protectedData;
  },
  
  // 🎯 DÉPROTÉGER UN PARTICIPANT
  unprotectParticipant(protectedParticipant) {
    const unprotectedData = { ...protectedParticipant };
    
    this.SENSITIVE_FIELDS.forEach(field => {
      if (protectedParticipant[field] && protectedParticipant[field] !== unprotectedData[field]) {
        try {
          unprotectedData[field] = EncryptionService.decrypt(protectedParticipant[field]);
        } catch (error) {
          console.warn(`⚠️ Impossible de déchiffrer ${field}`, error);
        }
      }
    });
    
    delete unprotectedData._protected;
    delete unprotectedData._protectedAt;
    
    return unprotectedData;
  },
  
  // 🎯 PROTÉGER TOUS LES PARTICIPANTS
  protectAllParticipants(participants) {
    return participants.map(participant => 
      participant._protected ? participant : this.protectParticipant(participant)
    );
  },
  
  // 🎯 VÉRIFIER LA PROTECTION
  isDataProtected(data) {
    return data._protected === true;
  }
};
