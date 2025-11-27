// src/utils/cryptoPaymentService.js - VERSION AVEC VÉRIFICATION AUTOMATIQUE
export const CryptoPaymentService = {
  
  // ✅ CONFIGURATION DES CRYPTOMONNAIES SUPPORTÉES
  SUPPORTED_CRYPTOS: {
    BTC: { name: 'Bitcoin', symbol: 'BTC', network: 'Bitcoin' },
    ETH: { name: 'Ethereum', symbol: 'ETH', network: 'ERC20' },
    USDT: { name: 'Tether', symbol: 'USDT', network: 'TRC20' },
    BNB: { name: 'Binance Coin', symbol: 'BNB', network: 'BEP20' },
    SOL: { name: 'Solana', symbol: 'SOL', network: 'Solana' }
  },

  // ✅ CONFIGURATION DES APIs EXPLORER
  BLOCK_EXPLORERS: {
    BTC: {
      name: 'BlockCypher',
      apiUrl: 'https://api.blockcypher.com/v1/btc/main',
      addressUrl: 'https://api.blockcypher.com/v1/btc/main/addrs/',
      requiredConfirmations: 2
    },
    ETH: {
      name: 'Etherscan',
      apiUrl: 'https://api.etherscan.io/api',
      apiKey: 'ADNDRBTM5IEFTF9RII3U1BWWIDI9A19PFI', // Obtenez-la sur etherscan.io
      addressUrl: 'https://api.etherscan.io/api?module=account&action=txlist&address=',
      requiredConfirmations: 12
    },
    USDT: {
      name: 'TRONSCAN',
      apiUrl: 'https://api.trongrid.io',
      addressUrl: 'https://api.trongrid.io/v1/accounts/',
      requiredConfirmations: 1
    },
    BNB: {
      name: 'BSCScan',
      apiUrl: 'https://api.bscscan.com/api',
      apiKey: 'VOTRE_CLE_BSCSCAN', // Obtenez-la sur bscscan.com
      addressUrl: 'https://api.bscscan.com/api?module=account&action=txlist&address=',
      requiredConfirmations: 15
    },
    SOL: {
      name: 'Solscan',
      apiUrl: 'https://public-api.solscan.io',
      addressUrl: 'https://public-api.solscan.io/account/transactions?account=',
      requiredConfirmations: 1
    }
  },

  // ✅ GÉNÉRATION D'ADRESSE DE PAIEMENT
  generatePaymentAddress(crypto, amount, ticketCount, participantInfo) {
    const paymentId = `TOMBO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentData = {
      id: paymentId,
      crypto: crypto,
      amount: amount,
      ticketCount: ticketCount,
      participant: participantInfo,
      timestamp: new Date().toISOString(),
      status: 'pending',
      requiredAmount: this.calculateRequiredAmount(crypto, amount)
    };

    // Sauvegarder la transaction en attente
    this.savePendingPayment(paymentData);
    
    return {
      paymentId: paymentId,
      crypto: crypto,
      amount: amount,
      requiredAmount: paymentData.requiredAmount,
      walletAddress: this.getWalletAddress(crypto),
      instructions: this.getPaymentInstructions(crypto, paymentData.requiredAmount),
      qrCode: this.generateQRCode(crypto, paymentData.requiredAmount),
      expiry: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };
  },

  // ✅ CALCUL DU MONTANT REQUIS (avec frais réseau)
  calculateRequiredAmount(crypto, amount) {
    const baseAmount = parseFloat(amount);
    const fees = {
      BTC: 0.0005, // frais réseau Bitcoin
      ETH: 0.003,  // frais gas Ethereum
      USDT: 1,     // frais TRC20
      BNB: 0.001,  // frais BEP20
      SOL: 0.0001  // frais Solana
    };

    return (baseAmount + (fees[crypto] || 0)).toFixed(8);
  },

  // ✅ ADRESSES WALLET (À CONFIGURER AVEC VOS VRAIES ADRESSES)
  getWalletAddress(crypto) {
    const addresses = {
      BTC: 'bc1qvxu6r67t4plqd529plchywcc7jnlwd6cndrwwc',
      ETH: '0x9e6133311e9ade7cbbd3ed0a8a891a7183dd5d57',
      USDT: 'TBaegYz3ZqgTg2n1pCq7QhQd1qLr9n4vWX',
      BNB: 'Ox9e6133311e9ade7cbbd3ed0a8a891a7183dd5d57',
      SOL: 'F9C8YCurZsmeKTFZ3DYZ2wWLzzHMA3du'
    };
    
    return addresses[crypto] || 'ADDRESS_NOT_CONFIGURED';
  },

  // ✅ GÉNÉRATION QR CODE
  generateQRCode(crypto, amount) {
    const address = this.getWalletAddress(crypto);
    const qrData = `${crypto}:${address}?amount=${amount}`;
    
    // Utiliser un service QR code (ex: QRServer.com)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  },

  // ✅ INSTRUCTIONS DE PAIEMENT
  getPaymentInstructions(crypto, amount) {
    const instructions = {
      BTC: `
        • Envoyez EXACTEMENT ${amount} BTC
        • Réseau: Bitcoin (BTC)
        • Adresse: ${this.getWalletAddress('BTC')}
        • Ne pas envoyer depuis un exchange
        • Confirmation requise: 2 blocs
      `,
      ETH: `
        • Envoyez EXACTEMENT ${amount} ETH
        • Réseau: Ethereum (ERC20)
        • Adresse: ${this.getWalletAddress('ETH')}
        • Prévoir les frais de gas
        • Confirmation requise: 12 blocs
      `,
      USDT: `
        • Envoyez EXACTEMENT ${amount} USDT
        • Réseau: Tron (TRC20) UNIQUEMENT
        • Adresse: ${this.getWalletAddress('USDT')}
        • Pas de frais supplémentaires
        • Confirmation rapide
      `,
      BNB: `
        • Envoyez EXACTEMENT ${amount} BNB
        • Réseau: Binance Smart Chain (BEP20)
        • Adresse: ${this.getWalletAddress('BNB')}
        • Faibles frais de réseau
      `,
      SOL: `
        • Envoyez EXACTEMENT ${amount} SOL
        • Réseau: Solana
        • Adresse: ${this.getWalletAddress('SOL')}
        • Transactions ultra-rapides
        • Frais négligeables
      `
    };
    
    return instructions[crypto] || 'Instructions non disponibles pour cette crypto.';
  },

  // ✅ SAUVEGARDE DES PAIEMENTS EN ATTENTE
  savePendingPayment(paymentData) {
    const pendingPayments = this.getPendingPayments();
    pendingPayments[paymentData.id] = paymentData;
    localStorage.setItem('cryptoPendingPayments', JSON.stringify(pendingPayments));
  },

  // ✅ RÉCUPÉRATION DES PAIEMENTS EN ATTENTE
  getPendingPayments() {
    return JSON.parse(localStorage.getItem('cryptoPendingPayments') || '{}');
  },

  // ✅ VÉRIFICATION AUTOMATIQUE DES TRANSACTIONS
  async verifyPayment(paymentId) {
    const pendingPayments = this.getPendingPayments();
    const payment = pendingPayments[paymentId];
    
    if (!payment) {
      return { status: 'not_found', message: 'Paiement non trouvé' };
    }

    try {
      const explorer = this.BLOCK_EXPLORERS[payment.crypto];
      const walletAddress = this.getWalletAddress(payment.crypto);
      const requiredAmount = payment.requiredAmount;

      // Vérifier selon la crypto
      switch (payment.crypto) {
        case 'BTC':
          return await this.verifyBitcoinPayment(walletAddress, requiredAmount, explorer);
        case 'ETH':
          return await this.verifyEthereumPayment(walletAddress, requiredAmount, explorer);
        case 'USDT':
          return await this.verifyTronPayment(walletAddress, requiredAmount, explorer);
        case 'BNB':
          return await this.verifyBSCPayment(walletAddress, requiredAmount, explorer);
        case 'SOL':
          return await this.verifySolanaPayment(walletAddress, requiredAmount, explorer);
        default:
          return { status: 'unsupported', message: 'Crypto non supportée pour vérification auto' };
      }
    } catch (error) {
      console.error('Erreur vérification paiement:', error);
      return { 
        status: 'error', 
        message: 'Erreur de vérification: ' + error.message 
      };
    }
  },

  // ✅ VÉRIFICATION BITCOIN (BlockCypher)
  async verifyBitcoinPayment(address, requiredAmount, explorer) {
    try {
      const response = await fetch(`${explorer.addressUrl}${address}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Vérifier les transactions récentes
      const recentTxs = data.txrefs || [];
      const matchingTx = recentTxs.find(tx => {
        const receivedAmount = tx.value / 100000000; // Convertir satoshis en BTC
        return Math.abs(receivedAmount - parseFloat(requiredAmount)) < 0.00000001 &&
               tx.confirmations >= explorer.requiredConfirmations;
      });

      if (matchingTx) {
        return {
          status: 'confirmed',
          message: 'Paiement Bitcoin confirmé !',
          transactionHash: matchingTx.tx_hash,
          confirmations: matchingTx.confirmations,
          amount: matchingTx.value / 100000000
        };
      }

      // Vérifier les transactions en attente
      const unconfirmedTxs = data.unconfirmed_txrefs || [];
      const pendingTx = unconfirmedTxs.find(tx => {
        const receivedAmount = tx.value / 100000000;
        return Math.abs(receivedAmount - parseFloat(requiredAmount)) < 0.00000001;
      });

      if (pendingTx) {
        return {
          status: 'pending',
          message: `Paiement détecté, en attente de confirmation (${pendingTx.confirmations}/${explorer.requiredConfirmations})`,
          transactionHash: pendingTx.tx_hash,
          confirmations: pendingTx.confirmations
        };
      }

      return { status: 'not_found', message: 'Aucun paiement correspondant trouvé' };

    } catch (error) {
      throw new Error(`Bitcoin: ${error.message}`);
    }
  },

  // ✅ VÉRIFICATION ETHEREUM (Etherscan)
  async verifyEthereumPayment(address, requiredAmount, explorer) {
    try {
      const apiKey = explorer.apiKey;
      const url = `${explorer.addressUrl}${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== '1') {
        throw new Error(data.message || 'Erreur API Etherscan');
      }

      const transactions = data.result || [];
      const requiredAmountWei = this.etherToWei(requiredAmount);
      
      const matchingTx = transactions.find(tx => {
        return tx.to.toLowerCase() === address.toLowerCase() &&
               tx.value === requiredAmountWei &&
               parseInt(tx.confirmations) >= explorer.requiredConfirmations;
      });

      if (matchingTx) {
        return {
          status: 'confirmed',
          message: 'Paiement Ethereum confirmé !',
          transactionHash: matchingTx.hash,
          confirmations: parseInt(matchingTx.confirmations),
          amount: this.weiToEther(matchingTx.value)
        };
      }

      // Vérifier les transactions en attente
      const pendingTx = transactions.find(tx => {
        return tx.to.toLowerCase() === address.toLowerCase() &&
               tx.value === requiredAmountWei &&
               parseInt(tx.confirmations) < explorer.requiredConfirmations;
      });

      if (pendingTx) {
        return {
          status: 'pending',
          message: `Paiement détecté, en attente de confirmation (${pendingTx.confirmations}/${explorer.requiredConfirmations})`,
          transactionHash: pendingTx.hash,
          confirmations: parseInt(pendingTx.confirmations)
        };
      }

      return { status: 'not_found', message: 'Aucun paiement correspondant trouvé' };

    } catch (error) {
      throw new Error(`Ethereum: ${error.message}`);
    }
  },

  // ✅ VÉRIFICATION TRON (TRONSCAN)
  async verifyTronPayment(address, requiredAmount, explorer) {
    try {
      const url = `${explorer.addressUrl}${address}/transactions`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.data) {
        throw new Error('Erreur API TRONSCAN');
      }

      const transactions = data.data || [];
      const requiredAmountSun = this.trxToSun(requiredAmount);
      
      const matchingTx = transactions.find(tx => {
        return tx.to === address &&
               parseInt(tx.raw_data.contract[0].parameter.value.amount) === requiredAmountSun &&
               tx.ret && tx.ret[0].contractRet === 'SUCCESS';
      });

      if (matchingTx) {
        return {
          status: 'confirmed',
          message: 'Paiement TRON confirmé !',
          transactionHash: matchingTx.txID,
          confirmations: 1, // TRON confirme instantanément
          amount: this.sunToTrx(matchingTx.raw_data.contract[0].parameter.value.amount)
        };
      }

      return { status: 'not_found', message: 'Aucun paiement correspondant trouvé' };

    } catch (error) {
      throw new Error(`TRON: ${error.message}`);
    }
  },

  // ✅ VÉRIFICATION BINANCE SMART CHAIN (BSCScan)
  async verifyBSCPayment(address, requiredAmount, explorer) {
    try {
      const apiKey = explorer.apiKey;
      const url = `${explorer.addressUrl}${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== '1') {
        throw new Error(data.message || 'Erreur API BSCScan');
      }

      const transactions = data.result || [];
      const requiredAmountWei = this.etherToWei(requiredAmount);
      
      const matchingTx = transactions.find(tx => {
        return tx.to.toLowerCase() === address.toLowerCase() &&
               tx.value === requiredAmountWei &&
               parseInt(tx.confirmations) >= explorer.requiredConfirmations;
      });

      if (matchingTx) {
        return {
          status: 'confirmed',
          message: 'Paiement BSC confirmé !',
          transactionHash: matchingTx.hash,
          confirmations: parseInt(matchingTx.confirmations),
          amount: this.weiToEther(matchingTx.value)
        };
      }

      const pendingTx = transactions.find(tx => {
        return tx.to.toLowerCase() === address.toLowerCase() &&
               tx.value === requiredAmountWei &&
               parseInt(tx.confirmations) < explorer.requiredConfirmations;
      });

      if (pendingTx) {
        return {
          status: 'pending',
          message: `Paiement détecté, en attente de confirmation (${pendingTx.confirmations}/${explorer.requiredConfirmations})`,
          transactionHash: pendingTx.hash,
          confirmations: parseInt(pendingTx.confirmations)
        };
      }

      return { status: 'not_found', message: 'Aucun paiement correspondant trouvé' };

    } catch (error) {
      throw new Error(`BSC: ${error.message}`);
    }
  },

  // ✅ VÉRIFICATION SOLANA (Solscan)
  async verifySolanaPayment(address, requiredAmount, explorer) {
    try {
      const url = `${explorer.addressUrl}${address}&limit=10`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Erreur API Solscan');
      }

      const requiredAmountLamports = this.solToLamports(requiredAmount);
      
      const matchingTx = data.find(tx => {
        return tx.destination === address &&
               parseInt(tx.lamport) === requiredAmountLamports &&
               tx.status === 'Success';
      });

      if (matchingTx) {
        return {
          status: 'confirmed',
          message: 'Paiement Solana confirmé !',
          transactionHash: matchingTx.txHash,
          confirmations: 1, // Solana confirme très rapidement
          amount: this.lamportsToSol(matchingTx.lamport)
        };
      }

      return { status: 'not_found', message: 'Aucun paiement correspondant trouvé' };

    } catch (error) {
      throw new Error(`Solana: ${error.message}`);
    }
  },

  // ✅ CONVERSIONS D'UNITÉS
  etherToWei(ether) {
    return Math.floor(parseFloat(ether) * 1e18).toString();
  },

  weiToEther(wei) {
    return (parseInt(wei) / 1e18).toFixed(8);
  },

  trxToSun(trx) {
    return Math.floor(parseFloat(trx) * 1e6);
  },

  sunToTrx(sun) {
    return (parseInt(sun) / 1e6).toFixed(6);
  },

  solToLamports(sol) {
    return Math.floor(parseFloat(sol) * 1e9);
  },

  lamportsToSol(lamports) {
    return (parseInt(lamports) / 1e9).toFixed(9);
  },

  // ✅ VÉRIFICATION AUTOMATIQUE EN TEMPS RÉEL
  startAutoVerification(paymentId, callback, interval = 30000) {
    const verificationInterval = setInterval(async () => {
      try {
        const result = await this.verifyPayment(paymentId);
        callback(result);
        
        if (result.status === 'confirmed') {
          clearInterval(verificationInterval);
          this.confirmPayment(paymentId, result.transactionHash);
        }
      } catch (error) {
        console.error('Erreur vérification auto:', error);
      }
    }, interval);

    return verificationInterval;
  },

  // ✅ GÉNÉRATION DE LIEN EXPLORER
  getExplorerLink(crypto, transactionHash) {
    const explorers = {
      BTC: `https://blockstream.info/tx/${transactionHash}`,
      ETH: `https://etherscan.io/tx/${transactionHash}`,
      USDT: `https://tronscan.org/#/transaction/${transactionHash}`,
      BNB: `https://bscscan.com/tx/${transactionHash}`,
      SOL: `https://solscan.io/tx/${transactionHash}`
    };
    
    return explorers[crypto] || '#';
  },

  // ✅ VÉRIFICATION MANUELLE DU PAIEMENT (pour compatibilité)
  async checkPaymentStatus(paymentId) {
    return await this.verifyPayment(paymentId);
  },

  // ✅ MARQUER UN PAIEMENT COMME CONFIRMÉ
  confirmPayment(paymentId, transactionHash) {
    const pendingPayments = this.getPendingPayments();
    const payment = pendingPayments[paymentId];
    
    if (payment) {
      payment.status = 'confirmed';
      payment.transactionHash = transactionHash;
      payment.confirmedAt = new Date().toISOString();
      
      // Sauvegarder
      localStorage.setItem('cryptoPendingPayments', JSON.stringify(pendingPayments));
      
      // Émettre un événement de paiement confirmé
      window.dispatchEvent(new CustomEvent('cryptoPaymentConfirmed', {
        detail: payment
      }));
      
      return payment;
    }
    
    return null;
  },

  // ✅ NETTOYAGE DES PAIEMENTS EXPIRÉS
  cleanupExpiredPayments() {
    const pendingPayments = this.getPendingPayments();
    const now = new Date();
    
    Object.keys(pendingPayments).forEach(paymentId => {
      const payment = pendingPayments[paymentId];
      const paymentTime = new Date(payment.timestamp);
      const expiryTime = new Date(paymentTime.getTime() + 30 * 60 * 1000); // 30 minutes
      
      if (now > expiryTime) {
        delete pendingPayments[paymentId];
      }
    });
    
    localStorage.setItem('cryptoPendingPayments', JSON.stringify(pendingPayments));
  }
};
