
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DataHandler = require('../utils/dataHandler');
const { createDeck, shuffleDeck, dealCards, getHandRank } = require('../utils/cardUtils');

class PokerGame {
    static activeGames = new Map();

    static startGame(userId, bet) {
        const userBalance = DataHandler.getUserBalance(userId);
        
        if (userBalance < bet) {
            return { success: false, message: 'Solde insuffisant!' };
        }

        if (this.activeGames.has(userId)) {
            return { success: false, message: 'Vous avez déjà une partie en cours!' };
        }

        // Déduire la mise
        DataHandler.setUserBalance(userId, userBalance - bet);

        // Créer et mélanger un deck
        const deck = shuffleDeck(createDeck());
        
        // Distribuer 5 cartes
        const hand = dealCards(deck, 5);
        
        const gameState = {
            deck: deck,
            hand: hand,
            selectedCards: [false, false, false, false, false],
            bet: bet,
            userId: userId,
            phase: 'selection'
        };

        this.activeGames.set(userId, gameState);

        const embed = new EmbedBuilder()
            .setTitle('🃏 POKER - Sélection des cartes')
            .setColor('Blue')
            .setDescription(`**Votre main:** ${hand.map(card => `${card.value}${card.suit}`).join(' ')}\n\n` +
                `**Mise:** ${bet} coins\n\n` +
                `Cliquez sur les cartes que vous souhaitez défausser, puis confirmez votre choix.`);

        const buttons = this.createCardButtons(gameState);

        return {
            success: true,
            embed: embed,
            components: buttons
        };
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

        if (action === 'poker' && params[0] === 'card') {
            await this.toggleCardSelection(interaction, parseInt(params[1]));
        } else if (action === 'poker' && params[0] === 'confirm') {
            await this.confirmSelection(interaction);
        }
    }

    static async toggleCardSelection(interaction, cardIndex) {
        const userId = interaction.user.id;
        const gameState = this.activeGames.get(userId);

        gameState.selectedCards[cardIndex] = !gameState.selectedCards[cardIndex];

        const selectedCount = gameState.selectedCards.filter(selected => selected).length;

        const embed = new EmbedBuilder()
            .setTitle('🃏 POKER - Sélection des cartes')
            .setColor('Blue')
            .setDescription(`**Votre main:** ${gameState.hand.map((card, i) => 
                `${gameState.selectedCards[i] ? '~~' : ''}${card.value}${card.suit}${gameState.selectedCards[i] ? '~~' : ''}`
            ).join(' ')}\n\n` +
                `**Cartes sélectionnées pour défausse:** ${selectedCount}\n` +
                `**Mise:** ${gameState.bet} coins\n\n` +
                `Cliquez sur les cartes que vous souhaitez défausser, puis confirmez votre choix.`);

        const buttons = this.createCardButtons(gameState);

        await interaction.update({
            embeds: [embed],
            components: buttons
        });
    }

    static async confirmSelection(interaction) {
        const userId = interaction.user.id;
        const gameState = this.activeGames.get(userId);

        // Remplacer les cartes sélectionnées
        for (let i = 0; i < 5; i++) {
            if (gameState.selectedCards[i]) {
                gameState.hand[i] = dealCards(gameState.deck, 1)[0];
            }
        }

        // Évaluer la main finale
        const handRank = getHandRank(gameState.hand);
        
        // Calculer les gains selon le classement
        const multipliers = {
            'Quinte Flush Royale': 250,
            'Quinte Flush': 50,
            'Carré': 25,
            'Full House': 9,
            'Couleur': 6,
            'Quinte': 4,
            'Brelan': 3,
            'Double Paire': 2,
            'Paire de Valets ou mieux': 1
        };

        const multiplier = multipliers[handRank.name] || 0;
        const winnings = gameState.bet * multiplier;

        if (winnings > 0) {
            const newBalance = DataHandler.getUserBalance(userId) + winnings;
            DataHandler.setUserBalance(userId, newBalance);
        }

        const defaussedCount = gameState.selectedCards.filter(selected => selected).length;

        const embed = new EmbedBuilder()
            .setTitle('🃏 POKER - Résultat final')
            .setColor(winnings > 0 ? 'Green' : 'Red')
            .setDescription(`**Cartes défaussées:** ${defaussedCount}\n` +
                `**Main finale:** ${gameState.hand.map(card => `${card.value}${card.suit}`).join(' ')}\n\n` +
                `**Résultat:** ${handRank.name}\n` +
                `**Mise:** ${gameState.bet} coins\n` +
                `**Gains:** ${winnings} coins\n` +
                `**Nouveau solde:** ${DataHandler.getUserBalance(userId)} coins`);

        // Nettoyer le jeu
        this.activeGames.delete(userId);

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }

    static createCardButtons(gameState) {
        const cardButtons = new ActionRowBuilder();
        
        for (let i = 0; i < 5; i++) {
            cardButtons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`poker_card_${i}`)
                    .setLabel(`${gameState.hand[i].value}${gameState.hand[i].suit}`)
                    .setStyle(gameState.selectedCards[i] ? ButtonStyle.Danger : ButtonStyle.Secondary)
            );
        }

        const selectedCount = gameState.selectedCards.filter(selected => selected).length;
        
        const actionButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`poker_confirm`)
                    .setLabel(`✅ Confirmer (${selectedCount} cartes à défausser)`)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(selectedCount === 0)
            );

        return [cardButtons, actionButton];
    }

    // Version simple pour compatibilité (utilisée par la commande directe)
    static play(userId, bet) {
        const userBalance = DataHandler.getUserBalance(userId);
        
        if (userBalance < bet) {
            return { success: false, message: 'Solde insuffisant!' };
        }

        // Déduire la mise
        DataHandler.setUserBalance(userId, userBalance - bet);

        // Créer et mélanger un deck
        const deck = shuffleDeck(createDeck());
        
        // Distribuer 5 cartes
        const hand = dealCards(deck, 5);
        
        // Évaluer la main
        const handRank = getHandRank(hand);
        
        // Calculer les gains selon le classement
        const multipliers = {
            'Quinte Flush Royale': 250,
            'Quinte Flush': 50,
            'Carré': 25,
            'Full House': 9,
            'Couleur': 6,
            'Quinte': 4,
            'Brelan': 3,
            'Double Paire': 2,
            'Paire de Valets ou mieux': 1
        };

        const multiplier = multipliers[handRank.name] || 0;
        const winnings = bet * multiplier;

        if (winnings > 0) {
            const newBalance = DataHandler.getUserBalance(userId) + winnings;
            DataHandler.setUserBalance(userId, newBalance);
        }

        const embed = new EmbedBuilder()
            .setTitle('🃏 POKER - 5 Cartes')
            .setColor(winnings > 0 ? 'Green' : 'Red')
            .setDescription(`**Votre main:** ${hand.map(card => `${card.value}${card.suit}`).join(' ')}\n\n` +
                `**Résultat:** ${handRank.name}\n` +
                `**Mise:** ${bet} coins\n` +
                `**Gains:** ${winnings} coins\n` +
                `**Nouveau solde:** ${DataHandler.getUserBalance(userId)} coins`);

        return { 
            success: true, 
            message: '',
            embed: embed
        };
    }
}

module.exports = PokerGame;
