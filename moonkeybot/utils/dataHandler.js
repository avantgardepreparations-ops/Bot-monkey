const fs = require('fs');
const path = require('path');

class DataHandler {
    static loadBalance() {
        try {
            const data = fs.readFileSync(path.join(__dirname, '../balances.json'), 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }

    static saveBalance(balances) {
        fs.writeFileSync(path.join(__dirname, '../balances.json'), JSON.stringify(balances, null, 2));
    }

    static loadJackpots() {
        const jackpotFile = './jackpots.json';
        try {
            if (fs.existsSync(jackpotFile)) {
                const data = fs.readFileSync(jackpotFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des jackpots:', error);
        }

        // Jackpots par défaut
        return {
            slots: 1000,
            poker: 2000,
            blackjack: 1500,
            roulette: 3000
        };
    }

    static saveJackpots(jackpots) {
        const jackpotFile = './jackpots.json';
        try {
            fs.writeFileSync(jackpotFile, JSON.stringify(jackpots, null, 2));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des jackpots:', error);
        }
    }

    static getUserBalance(userId) {
        const balances = this.loadBalance();
        return balances[userId] || 0;
    }

    static setUserBalance(userId, amount) {
        const balances = this.loadBalance();
        balances[userId] = amount;
        this.saveBalance(balances);
    }

    static addToBalance(userId, amount) {
        const currentBalance = this.getUserBalance(userId);
        this.setUserBalance(userId, currentBalance + amount);
    }

    static removeFromBalance(userId, amount) {
        const currentBalance = this.getUserBalance(userId);
        const newBalance = Math.max(0, currentBalance - amount);
        this.setUserBalance(userId, newBalance);
        return newBalance;
    }
}

module.exports = DataHandler;