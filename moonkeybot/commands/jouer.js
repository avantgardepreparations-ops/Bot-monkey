const { SlashCommandBuilder } = require('discord.js');
const { handleRoulette } = require('../games/roulette.js');
const SlotsGame = require('../games/slots.js');
const PokerGame = require('../games/poker.js');
const BlackjackGame = require('../games/blackjack.js');
const DataHandler = require('../utils/dataHandler.js');
const config = require('../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jouer')
        .setDescription('Utilise les raccourcis pour lancer un jeu ou une action.')
        .addStringOption(option =>
            option.setName('raccourci')
                .setDescription('Le raccourci de l\'action (ex: -r, -p, -sl, -bj, -d, -lb, -j)')
                .setRequired(true)
                .addChoices(
                    { name: 'Roulette (-r)', value: '-r' },
                    { name: 'Poker (-p)', value: '-p' },
                    { name: 'Slots (-sl)', value: '-sl' },
                    { name: 'Blackjack (-bj)', value: '-bj' },
                    { name: 'Daily (-d)', value: '-d' },
                    { name: 'Give (-g)', value: '-g' },
                    { name: 'Leaderboard (-lb)', value: '-lb' },
                    { name: 'Jackpots (-j)', value: '-j' }
                )
        )
        .addIntegerOption(option =>
            option.setName('mise')
                .setDescription('La mise pour les jeux d\'argent')
                .setRequired(false)
                .setMinValue(10)
        )
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur concerné par l\'action')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant pour la commande give')
                .setRequired(false)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const shortcut = interaction.options.getString('raccourci').toLowerCase();
        const bet = interaction.options.getInteger('mise');
        const targetUser = interaction.options.getUser('utilisateur');
        const amount = interaction.options.getInteger('montant');
        const userId = interaction.user.id;

        // Vérifier le solde initial pour les nouveaux joueurs
        const balance = DataHandler.getUserBalance(userId);
        if (balance === 0) {
            DataHandler.setUserBalance(userId, config.INITIAL_BALANCE);
        }

        switch (shortcut) {
            case '-r': // Roulette
                if (bet === null) {
                    return interaction.reply({ 
                        content: '❌ Veuillez spécifier une mise pour la roulette.', 
                        ephemeral: true 
                    });
                }
                await handleRoulette(interaction, bet);
                break;

            case '-p': // Poker
                if (bet === null) {
                    return interaction.reply({ 
                        content: '❌ Veuillez spécifier une mise pour le poker.', 
                        ephemeral: true 
                    });
                }
                const pokerResult = PokerGame.play(userId, bet);
                if (!pokerResult.success) {
                    return interaction.reply({
                        content: `❌ ${pokerResult.message}`,
                        ephemeral: true
                    });
                }
                await interaction.reply(pokerResult.message);
                break;

            case '-sl': // Slots
                if (bet === null) {
                    return interaction.reply({ 
                        content: '❌ Veuillez spécifier une mise pour les machines à sous.', 
                        ephemeral: true 
                    });
                }
                const slotsResult = SlotsGame.play(userId, bet);
                if (!slotsResult.success) {
                    return interaction.reply({
                        content: `❌ ${slotsResult.message}`,
                        ephemeral: true
                    });
                }
                await interaction.reply(slotsResult.message);
                break;

            case '-bj': // Blackjack
                if (bet === null) {
                    return interaction.reply({ 
                        content: '❌ Veuillez spécifier une mise pour le blackjack.', 
                        ephemeral: true 
                    });
                }
                const blackjackResult = BlackjackGame.startGame(userId, bet);
                if (!blackjackResult.success) {
                    return interaction.reply({
                        content: `❌ ${blackjackResult.message}`,
                        ephemeral: true
                    });
                }
                await interaction.reply(blackjackResult.message);
                break;

            case '-d': // Daily
                const now = Date.now();
                const userBalance = DataHandler.getUserBalance(userId);
                const lastDaily = DataHandler.getLastDaily(userId);
                const dayInMs = 24 * 60 * 60 * 1000;

                if (lastDaily && (now - lastDaily) < dayInMs) {
                    const timeLeft = dayInMs - (now - lastDaily);
                    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                    return interaction.reply({
                        content: `❌ Vous avez déjà récupéré votre bonus quotidien! Revenez dans ${hours}h ${minutes}m.`,
                        ephemeral: true
                    });
                }

                const dailyAmount = 100;
                DataHandler.setUserBalance(userId, userBalance + dailyAmount);
                DataHandler.setLastDaily(userId, now);

                const dailyEmbed = {
                    color: 0x00ff00,
                    title: '🎁 Bonus Quotidien',
                    description: `Vous avez reçu votre bonus quotidien de **${dailyAmount}** coins!`,
                    fields: [
                        {
                            name: '💰 Nouveau solde',
                            value: `${userBalance + dailyAmount} coins`,
                            inline: true
                        }
                    ],
                    timestamp: new Date()
                };

                await interaction.reply({ embeds: [dailyEmbed] });
                break;

            case '-g': // Give
                if (!targetUser || amount === null) {
                    return interaction.reply({ 
                        content: '❌ Veuillez spécifier un utilisateur et un montant pour la commande "give".', 
                        ephemeral: true 
                    });
                }

                if (targetUser.id === userId) {
                    return interaction.reply({
                        content: '❌ Vous ne pouvez pas vous envoyer de l\'argent à vous-même!',
                        ephemeral: true
                    });
                }

                const senderBalance = DataHandler.getUserBalance(userId);
                if (amount > senderBalance) {
                    return interaction.reply({
                        content: `❌ Vous n'avez pas assez d'argent! Vous avez ${senderBalance} coins.`,
                        ephemeral: true
                    });
                }

                const receiverBalance = DataHandler.getUserBalance(targetUser.id);
                DataHandler.setUserBalance(userId, senderBalance - amount);
                DataHandler.setUserBalance(targetUser.id, receiverBalance + amount);

                const giveEmbed = {
                    color: 0x00ff00,
                    title: '💸 Transfert d\'argent',
                    description: `**${interaction.user.username}** a envoyé **${amount}** coins à **${targetUser.username}**!`,
                    fields: [
                        {
                            name: `💰 ${interaction.user.username}`,
                            value: `${senderBalance - amount} coins`,
                            inline: true
                        },
                        {
                            name: `💰 ${targetUser.username}`,
                            value: `${receiverBalance + amount} coins`,
                            inline: true
                        }
                    ],
                    timestamp: new Date()
                };

                await interaction.reply({ embeds: [giveEmbed] });
                break;

            case '-lb': // Leaderboard
                const allBalances = DataHandler.getAllBalances();
                const sortedUsers = Object.entries(allBalances)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10);

                const leaderboardEmbed = {
                    color: 0xffd700,
                    title: '🏆 Classement du Casino',
                    description: 'Top 10 des joueurs les plus riches:',
                    fields: [],
                    timestamp: new Date()
                };

                for (let i = 0; i < sortedUsers.length; i++) {
                    const [userId, balance] = sortedUsers[i];
                    try {
                        const user = await interaction.client.users.fetch(userId);
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                        leaderboardEmbed.fields.push({
                            name: `${medal} ${user.username}`,
                            value: `${balance.toLocaleString()} coins`,
                            inline: true
                        });
                    } catch (error) {
                        console.error(`Impossible de récupérer l'utilisateur ${userId}:`, error);
                    }
                }

                await interaction.reply({ embeds: [leaderboardEmbed] });
                break;

            case '-j': // Jackpots
                const jackpots = DataHandler.loadJackpots();

                const jackpotEmbed = {
                    color: 0xffd700,
                    title: '🌟 Jackpots Progressifs',
                    description: 'Voici les jackpots progressifs actuels pour chaque jeu:',
                    fields: [
                        {
                            name: '🎰 Slots',
                            value: `${jackpots.slots.toLocaleString()} coins`,
                            inline: true
                        },
                        {
                            name: '🃏 Poker',
                            value: `${jackpots.poker.toLocaleString()} coins`,
                            inline: true
                        },
                        {
                            name: '🃏 Blackjack',
                            value: `${jackpots.blackjack.toLocaleString()} coins`,
                            inline: true
                        },
                        {
                            name: '🎡 Roulette',
                            value: `${jackpots.roulette.toLocaleString()} coins`,
                            inline: true
                        }
                    ],
                    footer: {
                        text: 'Les jackpots augmentent à chaque partie jouée!'
                    },
                    timestamp: new Date()
                };

                await interaction.reply({ embeds: [jackpotEmbed] });
                break;

            default:
                await interaction.reply({ 
                    content: '❌ Raccourci non reconnu. Utilisez les options du menu déroulant.', 
                    ephemeral: true 
                });
                break;
        }
    },
};