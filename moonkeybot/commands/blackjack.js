
const { SlashCommandBuilder } = require('discord.js');
const BlackjackGame = require('../games/blackjack');
const DataHandler = require('../utils/dataHandler');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Jouer au blackjack')
        .addIntegerOption(option =>
            option.setName('mise')
                .setDescription('Montant à miser')
                .setRequired(true)
                .setMinValue(10)
        ),
    
    async execute(interaction) {
        const bet = interaction.options.getInteger('mise');
        const userId = interaction.user.id;

        // Vérifier le solde initial
        const balance = DataHandler.getUserBalance(userId);
        if (balance === 0) {
            DataHandler.setUserBalance(userId, config.INITIAL_BALANCE);
        }

        const result = BlackjackGame.startGame(userId, bet);

        if (!result.success) {
            return interaction.reply({
                content: `❌ ${result.message}`,
                ephemeral: true
            });
        }

        await interaction.reply({
            embeds: [result.embed],
            components: result.components || []
        });
    }
};
