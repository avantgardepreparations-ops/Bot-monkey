const { SlashCommandBuilder } = require('discord.js');
const SlotsGame = require('../games/slots');
const DataHandler = require('../utils/dataHandler');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Jouer aux machines à sous (5 rouleaux avec options de double/quadruple)')
        .addIntegerOption(option =>
            option.setName('mise')
                .setDescription('Montant à miser')
                .setRequired(true)
                .setMinValue(10)
        ),

    async execute(interaction) {
        if (interaction.isButton()) {
            return await SlotsGame.handleButtonInteraction(interaction);
        }

        const bet = interaction.options.getInteger('mise');
        const userId = interaction.user.id;

        // Vérifier le solde initial
        const balance = DataHandler.getUserBalance(userId);
        if (balance === 0) {
            DataHandler.setUserBalance(userId, config.INITIAL_BALANCE);
        }

        // Initialiser et vérifier s'il y a déjà une partie en cours
        SlotsGame.initialize();
        if (SlotsGame.activeGames.has(userId)) {
            return interaction.reply({
                content: '❌ Vous avez déjà une partie de slots en cours!',
                ephemeral: true
            });
        }

        const result = await SlotsGame.startGame(interaction, bet);

        if (!result.success) {
            return interaction.reply({
                content: `❌ ${result.message}`,
                ephemeral: true
            });
        }
    }
};