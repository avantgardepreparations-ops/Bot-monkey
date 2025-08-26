
const { SlashCommandBuilder } = require('discord.js');
const RouletteGame = require('../games/roulette');
const DataHandler = require('../utils/dataHandler');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Jouer à la roulette avec interface interactive')
        .addIntegerOption(option =>
            option.setName('mise')
                .setDescription('Montant à miser')
                .setRequired(true)
                .setMinValue(10)
        ),

    async execute(interaction) {
        const betAmount = interaction.options.getInteger('mise');
        const userId = interaction.user.id;

        // Vérifier le solde initial
        const balance = DataHandler.getUserBalance(userId);
        if (balance === 0) {
            DataHandler.setUserBalance(userId, config.INITIAL_BALANCE);
        }

        // Utiliser la nouvelle version interactive
        await RouletteGame.handleRoulette(interaction, betAmount);
    }
};
