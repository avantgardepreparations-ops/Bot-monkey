
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DataHandler = require('../utils/dataHandler');

class SlotsGame {
    static symbols = ['🍒', '🍊', '🍋', '🍇', '🍉', '⭐', '💎', '7️⃣', '🔔'];
    static payouts = {
        '🍒': { 2: 1.5, 3: 3, 4: 5, 5: 10 },
        '🍊': { 2: 2, 3: 4, 4: 7, 5: 15 },
        '🍋': { 2: 2.5, 3: 5, 4: 10, 5: 20 },
        '🍇': { 2: 3, 3: 6, 4: 12, 5: 25 },
        '🍉': { 2: 3.5, 3: 7, 4: 15, 5: 30 },
        '⭐': { 2: 5, 3: 10, 4: 25, 5: 50 },
        '💎': { 2: 7, 3: 15, 4: 35, 5: 75 },
        '7️⃣': { 2: 10, 3: 20, 4: 50, 5: 100 },
        '🔔': { 2: 12, 3: 25, 4: 60, 5: 150 }
    };

    static activeGames = new Map();
    
    static initialize() {
        if (!this.activeGames) {
            this.activeGames = new Map();
        }
    }

    static async startGame(interaction, bet) {
        this.initialize();
        const userId = interaction.user.id;
        const userBalance = DataHandler.getUserBalance(userId);

        if (userBalance < bet) {
            return { success: false, message: 'Solde insuffisant!' };
        }

        // Contribuer au jackpot progressif (1% de la mise)
        const jackpotContribution = Math.floor(bet * 0.01);
        this.addToJackpot(jackpotContribution);

        // Déduire la mise
        DataHandler.setUserBalance(userId, userBalance - bet);

        // Premier lancer (5 rouleaux)
        const reels = [
            this.getRandomSymbol(),
            this.getRandomSymbol(),
            this.getRandomSymbol(),
            this.getRandomSymbol(),
            this.getRandomSymbol()
        ];

        const gameState = {
            reels: reels,
            lockedReels: [false, false, false, false, false],
            currentBet: bet,
            originalBet: bet,
            round: 1,
            userId: userId
        };

        this.activeGames.set(userId, gameState);

        const { winnings, combinations, isJackpot } = this.calculateWinnings(reels, bet);
        
        const embed = new EmbedBuilder()
            .setTitle('🎰 MACHINE À SOUS - PREMIER LANCER')
            .setColor('Gold')
            .setDescription(`**Rouleaux:** [ ${reels.join(' | ')} ]\n\n` +
                (combinations.length > 0 ? 
                    `**Combinaisons détectées:**\n${combinations.join('\n')}\n` : 
                    `**Aucune combinaison gagnante**\n`) +
                `**Mise actuelle:** ${bet} coins\n` +
                `**Gains potentiels:** ${winnings} coins\n` +
                `**Jackpot progressif:** ${this.getJackpot()} coins\n\n` +
                `Vous pouvez maintenant:\n` +
                `• **Encaisser** vos gains actuels\n` +
                `• **Doubler** la mise et bloquer des rouleaux\n` +
                `• Cliquez sur les rouleaux pour les bloquer avant de doubler`);

        const buttons = this.createButtons(gameState, winnings);

        await interaction.reply({ 
            embeds: [embed], 
            components: buttons
        });

        return { success: true };
    }

    static async handleButtonInteraction(interaction) {
        const userId = interaction.user.id;
        const gameState = this.activeGames.get(userId);

        if (!gameState) {
            return interaction.reply({
                content: '❌ Aucune partie en cours!',
                ephemeral: true
            });
        }

        const [action, ...params] = interaction.customId.split('_');

        switch (action) {
            case 'cashout':
                await this.cashOut(interaction, gameState);
                break;
            case 'double':
                await this.doubleOrQuadruple(interaction, gameState, 2);
                break;
            case 'quadruple':
                await this.doubleOrQuadruple(interaction, gameState, 4);
                break;
            case 'lock':
                await this.toggleLock(interaction, gameState, parseInt(params[0]));
                break;
        }
    }

    static async cashOut(interaction, gameState) {
        const { winnings } = this.calculateWinnings(gameState.reels, gameState.originalBet);
        
        if (winnings > 0) {
            const newBalance = DataHandler.getUserBalance(gameState.userId) + winnings;
            DataHandler.setUserBalance(gameState.userId, newBalance);
        }

        this.activeGames.delete(gameState.userId);

        const embed = new EmbedBuilder()
            .setTitle('💰 ENCAISSEMENT')
            .setColor('Green')
            .setDescription(`**Gains encaissés:** ${winnings} coins\n` +
                `**Nouveau solde:** ${DataHandler.getUserBalance(gameState.userId)} coins`);

        await interaction.update({ 
            embeds: [embed], 
            components: [] 
        });
    }

    static async doubleOrQuadruple(interaction, gameState, multiplier) {
        const newBet = gameState.originalBet * multiplier;
        const userBalance = DataHandler.getUserBalance(gameState.userId);

        if (userBalance < newBet - gameState.originalBet) {
            return interaction.reply({
                content: '❌ Solde insuffisant pour cette mise!',
                ephemeral: true
            });
        }

        // Déduire la différence de mise
        DataHandler.setUserBalance(gameState.userId, userBalance - (newBet - gameState.originalBet));

        // Nouveau lancer pour les rouleaux non bloqués
        for (let i = 0; i < 5; i++) {
            if (!gameState.lockedReels[i]) {
                gameState.reels[i] = this.getRandomSymbol();
            }
        }

        gameState.currentBet = newBet;
        gameState.round++;

        const { winnings, combinations, isJackpot } = this.calculateWinnings(gameState.reels, newBet);

        // Si jackpot, donner le jackpot complet
        let finalWinnings = winnings;
        if (isJackpot) {
            const jackpotAmount = this.getJackpot();
            finalWinnings += jackpotAmount;
            this.resetJackpot();
        }

        // Ajouter les gains au solde
        if (finalWinnings > 0) {
            const newBalance = DataHandler.getUserBalance(gameState.userId) + finalWinnings;
            DataHandler.setUserBalance(gameState.userId, newBalance);
        }

        const lockedIndicator = gameState.lockedReels.map(locked => locked ? '🔒' : '🔓').join(' ');

        const embed = new EmbedBuilder()
            .setTitle(`🎰 MACHINE À SOUS - ${multiplier === 2 ? 'DOUBLE' : 'QUADRUPLE'}`)
            .setColor(finalWinnings > 0 ? 'Green' : 'Red')
            .setDescription(`**Rouleaux:** [ ${gameState.reels.join(' | ')} ]\n` +
                `**Verrouillés:** [ ${lockedIndicator} ]\n\n` +
                (combinations.length > 0 ? 
                    `**Combinaisons gagnantes:**\n${combinations.join('\n')}\n` : 
                    `**Aucune combinaison gagnante**\n`) +
                (isJackpot ? `**🎉 JACKPOT! +${this.getJackpot()} coins 🎉**\n` : '') +
                `**Mise finale:** ${newBet} coins\n` +
                `**Gains totaux:** ${finalWinnings} coins\n` +
                `**Nouveau solde:** ${DataHandler.getUserBalance(gameState.userId)} coins`);

        // Si round 2, permettre quadruple
        let buttons = [];
        if (gameState.round === 2 && finalWinnings === 0) {
            buttons = this.createButtons(gameState, finalWinnings);
        }

        this.activeGames.delete(gameState.userId);

        await interaction.update({ 
            embeds: [embed], 
            components: buttons 
        });
    }

    static async toggleLock(interaction, gameState, reelIndex) {
        gameState.lockedReels[reelIndex] = !gameState.lockedReels[reelIndex];

        const { winnings } = this.calculateWinnings(gameState.reels, gameState.originalBet);
        const lockedIndicator = gameState.lockedReels.map(locked => locked ? '🔒' : '🔓').join(' ');

        const embed = new EmbedBuilder()
            .setTitle(`🎰 MACHINE À SOUS - ROULEAUX ${gameState.round === 1 ? 'PREMIER LANCER' : 'DEUXIÈME LANCER'}`)
            .setColor('Gold')
            .setDescription(`**Rouleaux:** [ ${gameState.reels.join(' | ')} ]\n` +
                `**Verrouillés:** [ ${lockedIndicator} ]\n\n` +
                `**Mise actuelle:** ${gameState.currentBet} coins\n` +
                `**Gains potentiels:** ${winnings} coins\n` +
                `**Jackpot progressif:** ${this.getJackpot()} coins\n\n` +
                `Sélectionnez les rouleaux à bloquer puis choisissez votre action.`);

        const buttons = this.createButtons(gameState, winnings);

        await interaction.update({ 
            embeds: [embed], 
            components: buttons 
        });
    }

    static createButtons(gameState, winnings) {
        const reelButtons = new ActionRowBuilder();
        for (let i = 0; i < 5; i++) {
            reelButtons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`lock_${i}`)
                    .setLabel(`${gameState.reels[i]} ${gameState.lockedReels[i] ? '🔒' : '🔓'}`)
                    .setStyle(gameState.lockedReels[i] ? ButtonStyle.Primary : ButtonStyle.Secondary)
            );
        }

        const actionButtons = new ActionRowBuilder();
        
        if (winnings > 0) {
            actionButtons.addComponents(
                new ButtonBuilder()
                    .setCustomId('cashout')
                    .setLabel(`💰 Encaisser ${winnings} coins`)
                    .setStyle(ButtonStyle.Success)
            );
        }

        if (gameState.round === 1) {
            actionButtons.addComponents(
                new ButtonBuilder()
                    .setCustomId('double')
                    .setLabel(`🎲 Doubler (${gameState.originalBet * 2} coins)`)
                    .setStyle(ButtonStyle.Danger)
            );
        } else if (gameState.round === 2) {
            actionButtons.addComponents(
                new ButtonBuilder()
                    .setCustomId('quadruple')
                    .setLabel(`🎲 Quadrupler (${gameState.originalBet * 4} coins)`)
                    .setStyle(ButtonStyle.Danger)
            );
        }

        return [reelButtons, actionButtons];
    }

    static getRandomSymbol() {
        return this.symbols[Math.floor(Math.random() * this.symbols.length)];
    }

    static calculateWinnings(reels, bet) {
        let totalWinnings = 0;
        let combinations = [];
        let isJackpot = false;

        // Vérifier le jackpot (5 symboles identiques de 7️⃣ ou 💎)
        const allSame = reels.every(symbol => symbol === reels[0]);
        if (allSame && (reels[0] === '7️⃣' || reels[0] === '💎')) {
            isJackpot = true;
            combinations.push(`🎉 JACKPOT! ${reels[0]} x5`);
        }

        // Compter les occurrences de chaque symbole
        const symbolCounts = {};
        reels.forEach(symbol => {
            symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
        });

        // Calculer les gains pour chaque symbole
        for (const [symbol, count] of Object.entries(symbolCounts)) {
            if (count >= 2 && this.payouts[symbol]) {
                const multiplier = this.payouts[symbol][count] || 0;
                const winAmount = Math.floor(bet * multiplier);
                totalWinnings += winAmount;
                combinations.push(`${symbol} x${count}: +${winAmount} coins`);
            }
        }

        return { winnings: totalWinnings, combinations, isJackpot };
    }

    static addToJackpot(amount) {
        const jackpots = DataHandler.loadJackpots();
        jackpots.slots += amount;
        DataHandler.saveJackpots(jackpots);
    }

    static getJackpot() {
        const jackpots = DataHandler.loadJackpots();
        return jackpots.slots;
    }

    static resetJackpot() {
        const jackpots = DataHandler.loadJackpots();
        jackpots.slots = 1000; // Jackpot de base
        DataHandler.saveJackpots(jackpots);
    }
}

module.exports = SlotsGame;
