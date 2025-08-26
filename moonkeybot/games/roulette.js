
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const DataHandler = require('../utils/dataHandler');

class RouletteGame {
    static numbers = {
        0: 'green', 1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black', 7: 'red', 8: 'black', 9: 'red', 10: 'black',
        11: 'black', 12: 'red', 13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red', 19: 'red', 20: 'black',
        21: 'red', 22: 'black', 23: 'red', 24: 'black', 25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
        31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
    };

    static activeGames = new Map();

    static async handleRoulette(interaction, betAmount) {
        const userId = interaction.user.id;
        const userBalance = DataHandler.getUserBalance(userId);

        if (userBalance < betAmount) {
            return interaction.reply({
                content: '❌ Solde insuffisant!',
                ephemeral: true
            });
        }

        if (this.activeGames.has(userId)) {
            return interaction.reply({
                content: '❌ Vous avez déjà une partie en cours!',
                ephemeral: true
            });
        }

        // Créer l'état du jeu
        const gameState = {
            userId: userId,
            betAmount: betAmount,
            selectedChoices: []
        };

        this.activeGames.set(userId, gameState);

        const embed = new EmbedBuilder()
            .setTitle('🎲 ROULETTE')
            .setColor('Gold')
            .setDescription(`**Mise:** ${betAmount} coins\n\nChoisissez vos paris dans le menu déroulant ci-dessous:`);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`roulette_select_${userId}`)
            .setPlaceholder('Choisissez vos paris...')
            .setMinValues(1)
            .setMaxValues(6)
            .addOptions([
                {
                    label: 'Rouge (x2)',
                    description: 'Parier sur les numéros rouges',
                    value: 'red',
                    emoji: '🔴'
                },
                {
                    label: 'Noir (x2)',
                    description: 'Parier sur les numéros noirs',
                    value: 'black',
                    emoji: '⚫'
                },
                {
                    label: 'Vert (x36)',
                    description: 'Parier sur le zéro',
                    value: 'green',
                    emoji: '🟢'
                },
                {
                    label: 'Pair (x2)',
                    description: 'Parier sur les numéros pairs',
                    value: 'even',
                    emoji: '2️⃣'
                },
                {
                    label: 'Impair (x2)',
                    description: 'Parier sur les numéros impairs',
                    value: 'odd',
                    emoji: '1️⃣'
                },
                {
                    label: 'Premier tiers 1-12 (x3)',
                    description: 'Parier sur les numéros 1 à 12',
                    value: 'first_third',
                    emoji: '🥇'
                },
                {
                    label: 'Deuxième tiers 13-24 (x3)',
                    description: 'Parier sur les numéros 13 à 24',
                    value: 'second_third',
                    emoji: '🥈'
                },
                {
                    label: 'Troisième tiers 25-36 (x3)',
                    description: 'Parier sur les numéros 25 à 36',
                    value: 'third_third',
                    emoji: '🥉'
                }
            ]);

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`roulette_spin_${userId}`)
                    .setLabel('🎰 Lancer la roue!')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row1, row2]
        });
    }

    static async handleSelectMenu(interaction) {
        const userId = interaction.user.id;
        const gameState = this.activeGames.get(userId);

        if (!gameState) {
            return interaction.reply({
                content: '❌ Aucune partie en cours!',
                ephemeral: true
            });
        }

        gameState.selectedChoices = interaction.values;

        const betLabels = {
            'red': 'Rouge (x2)',
            'black': 'Noir (x2)',
            'green': 'Vert (x36)',
            'even': 'Pair (x2)',
            'odd': 'Impair (x2)',
            'first_third': '1er tiers 1-12 (x3)',
            'second_third': '2ème tiers 13-24 (x3)',
            'third_third': '3ème tiers 25-36 (x3)'
        };

        const selectedBetsText = gameState.selectedChoices.map(choice => betLabels[choice]).join('\n• ');

        const embed = new EmbedBuilder()
            .setTitle('🎲 ROULETTE')
            .setColor('Gold')
            .setDescription(`**Mise:** ${gameState.betAmount} coins\n\n**Paris sélectionnés:**\n• ${selectedBetsText}\n\nCliquez sur "Lancer la roue!" pour jouer!`);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`roulette_select_${userId}`)
            .setPlaceholder('Modifier vos paris...')
            .setMinValues(1)
            .setMaxValues(6)
            .addOptions([
                {
                    label: 'Rouge (x2)',
                    description: 'Parier sur les numéros rouges',
                    value: 'red',
                    emoji: '🔴',
                    default: gameState.selectedChoices.includes('red')
                },
                {
                    label: 'Noir (x2)',
                    description: 'Parier sur les numéros noirs',
                    value: 'black',
                    emoji: '⚫',
                    default: gameState.selectedChoices.includes('black')
                },
                {
                    label: 'Vert (x36)',
                    description: 'Parier sur le zéro',
                    value: 'green',
                    emoji: '🟢',
                    default: gameState.selectedChoices.includes('green')
                },
                {
                    label: 'Pair (x2)',
                    description: 'Parier sur les numéros pairs',
                    value: 'even',
                    emoji: '2️⃣',
                    default: gameState.selectedChoices.includes('even')
                },
                {
                    label: 'Impair (x2)',
                    description: 'Parier sur les numéros impairs',
                    value: 'odd',
                    emoji: '1️⃣',
                    default: gameState.selectedChoices.includes('odd')
                },
                {
                    label: 'Premier tiers 1-12 (x3)',
                    description: 'Parier sur les numéros 1 à 12',
                    value: 'first_third',
                    emoji: '🥇',
                    default: gameState.selectedChoices.includes('first_third')
                },
                {
                    label: 'Deuxième tiers 13-24 (x3)',
                    description: 'Parier sur les numéros 13 à 24',
                    value: 'second_third',
                    emoji: '🥈',
                    default: gameState.selectedChoices.includes('second_third')
                },
                {
                    label: 'Troisième tiers 25-36 (x3)',
                    description: 'Parier sur les numéros 25 à 36',
                    value: 'third_third',
                    emoji: '🥉',
                    default: gameState.selectedChoices.includes('third_third')
                }
            ]);

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`roulette_spin_${userId}`)
                    .setLabel('🎰 Lancer la roue!')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(false)
            );

        await interaction.update({
            embeds: [embed],
            components: [row1, row2]
        });
    }

    static async spinWheel(interaction) {
        const userId = interaction.user.id;
        const gameState = this.activeGames.get(userId);

        if (!gameState || gameState.selectedChoices.length === 0) {
            return interaction.reply({
                content: '❌ Vous devez sélectionner au moins un pari!',
                ephemeral: true
            });
        }

        // Déduire la mise
        const userBalance = DataHandler.getUserBalance(userId);
        DataHandler.setUserBalance(userId, userBalance - gameState.betAmount);

        // Lancer la roulette
        const winningNumber = Math.floor(Math.random() * 37);
        const winningColor = this.numbers[winningNumber];

        let totalWinnings = 0;
        const results = [];

        // Vérifier chaque pari
        gameState.selectedChoices.forEach(bet => {
            let isWin = false;
            let multiplier = 0;

            switch (bet) {
                case 'red':
                    isWin = winningColor === 'red';
                    multiplier = 2;
                    break;
                case 'black':
                    isWin = winningColor === 'black';
                    multiplier = 2;
                    break;
                case 'green':
                    isWin = winningColor === 'green';
                    multiplier = 36;
                    break;
                case 'even':
                    isWin = winningNumber !== 0 && winningNumber % 2 === 0;
                    multiplier = 2;
                    break;
                case 'odd':
                    isWin = winningNumber % 2 === 1;
                    multiplier = 2;
                    break;
                case 'first_third':
                    isWin = winningNumber >= 1 && winningNumber <= 12;
                    multiplier = 3;
                    break;
                case 'second_third':
                    isWin = winningNumber >= 13 && winningNumber <= 24;
                    multiplier = 3;
                    break;
                case 'third_third':
                    isWin = winningNumber >= 25 && winningNumber <= 36;
                    multiplier = 3;
                    break;
            }

            if (isWin) {
                const winAmount = Math.floor(gameState.betAmount * multiplier / gameState.selectedChoices.length);
                totalWinnings += winAmount;
                results.push(`✅ ${this.getBetLabel(bet)}: +${winAmount} coins`);
            } else {
                results.push(`❌ ${this.getBetLabel(bet)}: -${Math.floor(gameState.betAmount / gameState.selectedChoices.length)} coins`);
            }
        });

        // Ajouter les gains
        if (totalWinnings > 0) {
            const newBalance = DataHandler.getUserBalance(userId) + totalWinnings;
            DataHandler.setUserBalance(userId, newBalance);
        }

        const colorEmoji = winningColor === 'red' ? '🔴' : winningColor === 'black' ? '⚫' : '🟢';

        const embed = new EmbedBuilder()
            .setTitle('🎲 ROULETTE - RÉSULTAT')
            .setColor(totalWinnings > 0 ? 'Green' : 'Red')
            .setDescription(`**Numéro gagnant:** ${winningNumber} ${colorEmoji}\n\n` +
                `**Résultats de vos paris:**\n${results.join('\n')}\n\n` +
                `**Gains totaux:** ${totalWinnings} coins\n` +
                `**Nouveau solde:** ${DataHandler.getUserBalance(userId)} coins`);

        // Nettoyer le jeu
        this.activeGames.delete(userId);

        await interaction.update({
            embeds: [embed],
            components: []
        });
    }

    static getBetLabel(bet) {
        const labels = {
            'red': 'Rouge',
            'black': 'Noir',
            'green': 'Vert',
            'even': 'Pair',
            'odd': 'Impair',
            'first_third': '1er tiers',
            'second_third': '2ème tiers',
            'third_third': '3ème tiers'
        };
        return labels[bet] || bet;
    }
}

module.exports = RouletteGame;
