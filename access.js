// Configuration des adresses Web3
const WALLET_DE_RECEPTION = "0x872bD846596Cc1aEde8Fd800997d242e3473fA83"; 
const TALON_TOKEN_ADDRESS = "0x0c6417054f8b303ddb821b1349124d656ea4be13"; 

// Mini ABI standard pour interagir avec les fonctions d'un jeton ERC-20
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 value) returns (bool)",
    "function decimals() view returns (uint8)"
];

/**
 * Vérifie si le portefeuille est connecté et lance le paiement de 10 $TALON
 * @param {string} gameName - Nom du jeu ('tetris')
 * @returns {boolean} - true si le paiement est validé, false sinon
 */
async function checkGameAccess(gameName) {
    if (!window.ethereum) {
        alert("Portefeuille Web3 non détecté. Si vous jouez depuis Warpcast (Farcaster), assurez-vous d'utiliser le navigateur Web3 intégré à l'application.");
        return false;
    }

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        alert("Préparation du décollage 🦅\nUne transaction de 10 $TALON va vous être demandée pour lancer la partie.");
        
        // Exécute le paiement initial de 10 $TALON
        const transactionReussie = await executeTalonPayment(signer, 10);
        return transactionReussie;

    } catch (error) {
        console.error("Erreur d'accès au portefeuille :", error);
        alert("Impossible de se connecter au portefeuille ou accès refusé.");
        return false;
    }
}

/**
 * Gère le transfert de jetons $TALON vers ton adresse Primary Farcaster
 * @param {ethers.Signer} signer - Le gestionnaire de signature Ethers.js
 * @param {number} amount - Le montant (10 pour le Start, 5 pour le Revive)
 * @returns {boolean} - true si validé sur la blockchain, false sinon
 */
async function executeTalonPayment(signer, amount) {
    try {
        const tokenContract = new ethers.Contract(TALON_TOKEN_ADDRESS, ERC20_ABI, signer);
        
        // Récupération des décimales du token
        const decimals = await tokenContract.decimals();
        const montantEnWei = ethers.parseUnits(amount.toString(), decimals);
        
        // Vérification du solde du joueur
        const adresseJoueur = await signer.getAddress();
        const solde = await tokenContract.balanceOf(adresseJoueur);
        
        if (solde < montantEnWei) {
            alert(`Solde insuffisant. Vous avez besoin de ${amount} $TALON pour cette action.`);
            return false;
        }

        // Envoi de la transaction vers ton adresse Farcaster
        const tx = await tokenContract.transfer(WALLET_DE_RECEPTION, montantEnWei);
        console.log(`Transaction soumise. Hash: ${tx.hash}`);
        
        // Attente de la validation du bloc
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log("Transfert $TALON validé !");
            return true;
        } else {
            alert("La transaction a échoué sur la blockchain.");
            return false;
        }

    } catch (error) {
        console.error("Erreur durant le paiement :", error);
        if (error.code === "ACTION_REJECTED" || error.code === 4001) {
            alert("Vous avez annulé la transaction.");
        } else {
            alert("Une erreur technique est survenue lors du transfert de tokens.");
        }
        return false;
    }
}
