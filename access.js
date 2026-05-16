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
 */
async function checkGameAccess(gameName) {
    console.log("Bouton START cliqué, vérification du wallet...");
    
    if (!window.ethereum) {
        alert("Portefeuille Web3 non détecté. Utilisez le navigateur d'un portefeuille crypto ou de Warpcast.");
        return false;
    }

    try {
        // Demande explicite de connexion aux comptes pour les portefeuilles mobiles
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Initialisation du provider avec tolérance pour les réseaux mobiles
        const provider = new ethers.BrowserProvider(window.ethereum, "any");
        const signer = await provider.getSigner();
        
        alert("Préparation du décollage 🦅\nUne transaction de 10 $TALON va vous être demandée.");
        
        // Lancement du paiement
        const transactionReussie = await executeTalonPayment(signer, 10);
        return transactionReussie;

    } catch (error) {
        console.error("Erreur d'accès :", error);
        alert("Erreur de connexion au portefeuille : " + (error.message || error));
        return false;
    }
}

/**
 * Gère le transfert de jetons $TALON
 */
async function executeTalonPayment(signer, amount) {
    try {
        // On crée l'instance du contrat proprement à l'intérieur de la fonction
        const tokenContract = new ethers.Contract(
            TALON_TOKEN_ADDRESS.toLowerCase(), 
            ERC20_ABI, 
            signer
        );
        
        // Récupération sécurisée des décimales
        const decimals = await tokenContract.decimals();
        const montantEnWei = ethers.parseUnits(amount.toString(), decimals);
        
        // Vérification du solde du joueur
        const adresseJoueur = await signer.getAddress();
        const solde = await tokenContract.balanceOf(adresseJoueur);
        
        if (solde < montantEnWei) {
            alert(`Solde insuffisant. Vous avez besoin de ${amount} $TALON.`);
            return false;
        }

        // Envoi du virement de jetons
        const tx = await tokenContract.transfer(WALLET_DE_RECEPTION, montantEnWei);
        console.log(`Transaction soumise : ${tx.hash}`);
        
        // Attente de confirmation
        const receipt = await tx.wait();
        return (receipt && receipt.status === 1);

    } catch (error) {
        console.error("Erreur durant le paiement :", error);
        alert("La transaction a échoué ou a été annulée.");
        return false;
    }
}
