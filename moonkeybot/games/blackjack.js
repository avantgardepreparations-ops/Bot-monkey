
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const DataHandler = require('../utils/dataHandler');
const { createDeck, shuffleDeck, dealCards, calculateHandValue } = require('../utils/cardUtils');

class BlackjackGame {
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

        // Créer le jeu
        const deck = shuffleDeck(createDeck());
        const playerHand = dealCards(deck, 2);
        const dealerHand = dealCards(deck, 2);

        const gameState = {
            deck: deck,
            playerHand: playerHand,
            dealerHand: dealerHand,
            bet: bet,
            userId: userId,
            gameOver: false
        };

        this.activeGames.set(userId, gameState);

        const playerValue = calculateHandValue(playerHand);
        const dealerVisibleCard = dealerHand[0];

        const embed = new EmbedBuilder()
            .setTitle('🃏 BLACKJACK')
            .setColor('Blue')
            .setDescription(`**Vos cartes:** ${playerHand.map(card => `${card.value}${card.suit}`).join(' ')}\n` +
                `**Valeur:** ${playerValue}\n\n` +
                `**Carte visible du croupier:** ${dealerVisibleCard.value}${dealerVisibleCard.suit}\n` +
                `**Carte cachée:** 🎴\n\n` +
                `**Mise:** ${bet} coins`);

        // Vérifier blackjack naturel
        if (playerValue === 21) {
            return this.endGame(userId, 'blackjack');
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`blackjack_hit_${userId}`)
                    .setLabel('🃏 Tirer une carte')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`blackjack_stand_${userId}`)
                    .setLabel('✋ S\'arrêter')
                    .setStyle(ButtonStyle.Secondary)
            );

        return {
            success: true,
            embed: embed,
            components: [row]
        };
    }

    static async handleButtonInteraction(interaction) {
        const userId = interaction.user.id;
        const action = interaction.customId.split('_')[1];

        if (action === 'hit') {
            await this.hit(interaction);
        } else if (action === 'stand') {
            await this.stand(interaction);
        }
    }

    static async hit(interaction) {
        const userId = interaction.user.id;
        const gameState = this.activeGames.get(userId);
        
        if (!gameState || gameState.gameOver) {
            return interaction.reply({
                content: '❌ Aucune partie en cours!',
                ephemeral: true
            });
        }

        // Tirer une carte
        const newCard = dealCards(gameState.deck, 1)[0];
        gameState.playerHand.push(newCard);

        const playerValue = calculateHandValue(gameState.playerHand);

        if (playerValue > 21) {
            return this.endGame(interaction, 'bust');
        }

        const embed = new EmbedBuilder()
            .setTitle('🃏 BLACKJACK')
            .setColor('Blue')
            .setDescription(`**Vos cartes:** ${gameState.playerHand.map(card => `${card.value}${card.suit}`).join(' ')}\n` +
                `**Valeur:** ${playerValue}\n\n` +
                `**Carte visible du croupier:** ${gameState.dealerHand[0].value}${gameState.dealerHand[0].suit}\n` +
                `**Carte cachée:** 🎴\n\n` +
                `**Mise:** ${gameState.bet} coins`);

        if (playerValue === 21) {
            return this.stand(interaction);
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`blackjack_hit_${userId}`)
                    .setLabel('🃏 Tirer une carte')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`blackjack_stand_${userId}`)
                    .setLabel('✋ S\'arrêter')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({
            embeds: [embed],
            components: [row]
        });
    }

    static async stand(interaction) {
        const userId = interaction.user.id;
        const gameState = this.activeGames.get(userId);
        
        if (!gameState || gameState.gameOver) {
            return interaction.reply({
                content: '❌ Aucune partie en cours!',
                ephemeral: true
            });
        }

        // Le croupier tire jusqu'à 17
        while (calculateHandValue(gameState.dealerHand) < 17) {
            const newCard = dealCards(gameState.deck, 1)[0];
            gameState.dealerHand.push(newCard);
        }

        const playerValue = calculateHandValue(gameState.playerHand);
        const dealerValue = calculateHandValue(gameState.dealerHand);

        let result;
        if (dealerValue > 21) {
            result = 'dealer_bust';
        } else if (playerValue > dealerValue) {
            result = 'win';
        } else if (playerValue === dealerValue) {
            result = 'tie';
        } else {
            result = 'lose';
        }

        return this.endGame(interaction, result);
    }

    static async endGame(interaction, result) {
        const userId = interaction.user.id;
        const gameState = this.activeGames.get(userId);
        
        if (!gameState) {
            return interaction.reply({
                content: '❌ Aucune partie en cours!',
                ephemeral: true
            });
        }

        gameState.gameOver = true;

        const playerValue = calculateHandValue(gameState.playerHand);
        const dealerValue = calculateHandValue(gameState.dealerHand);

        let winnings = 0;
        let resultText = '';

        switch (result) {
            case 'blackjack':
                winnings = Math.floor(gameState.bet * 2.5);
                resultText = '🎉 BLACKJACK! Vous avez gagné!';
                break;
            case 'win':
            case 'dealer_bust':
                winnings = gameState.bet * 2;
                resultText = result === 'dealer_bust' ? '🎉 Le croupier a dépassé 21! Vous gagnez!' : '🎉 Vous avez gagné!';
                break;
            case 'tie':
                winnings = gameState.bet;
                resultText = '🤝 Égalité! Mise remboursée.';
                break;
            case 'lose':
                winnings = 0;
                resultText = '💥 Vous avez perdu!';
                break;
            case 'bust':
                winnings = 0;
                resultText = '💥 Vous avez dépassé 21! Vous perdez!';
                break;
        }

        if (winnings > 0) {
            const newBalance = DataHandler.getUserBalance(userId) + winnings;
            DataHandler.setUserBalance(userId, newBalance);
        }

        const embed = new EmbedBuilder()
            .setTitle('🃏 BLACKJACK - RÉSULTAT')
            .setColor(winnings > 0 ? 'Green' : 'Red')
            .setDescription(`**Vos cartes:** ${gameState.playerHand.map(card => `${card.value}${card.suit}`).join(' ')} (${playerValue})\n` +
                `**Cartes du croupier:** ${gameState.dealerHand.map(card => `${card.value}${card.suit}`).join(' ')} (${dealerValue})\n\n` +
                `${resultText}\n\n` +
                `**Gains:** ${winnings} coins\n` +
                `**Nouveau solde:** ${DataHandler.getUserBalance(userId)} coins`);

        // Nettoyer le jeu
        this.activeGames.delete(userId);

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }
}

module.exports = BlackjackGame;
