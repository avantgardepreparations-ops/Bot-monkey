
const { SlashCommandBuilder } = require('discord.js');
const PokerGame = require('../games/poker');
const DataHandler = require('../utils/dataHandler');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poker')
        .setDescription('Jouer au poker (5 cartes)')
        .addIntegerOption(option =>
            option.setName('mise')
                .setDescription('Montant à miser')
                .setRequired(true)
                .setMinValue(10)
        )
        .addBooleanOption(option =>
            option.setName('interactif')
                .setDescription('Mode interactif avec sélection de cartes')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        const bet = interaction.options.getInteger('mise');
        const interactive = interaction.options.getBoolean('interactif') ?? true;
        const userId = interaction.user.id;

        // Vérifier le solde initial
        const balance = DataHandler.getUserBalance(userId);
        if (balance === 0) {
            DataHandler.setUserBalance(userId, config.INITIAL_BALANCE);
        }

        if (interactive) {
            const result = PokerGame.startGame(userId, bet);

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
        } else {
            const result = PokerGame.play(userId, bet);

            if (!result.success) {
                return interaction.reply({
                    content: `❌ ${result.message}`,
                    ephemeral: true
                });
            }

            await interaction.reply({ embeds: [result.embed] });
        }
    }
};
