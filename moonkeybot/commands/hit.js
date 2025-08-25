
const { SlashCommandBuilder } = require('discord.js');
const BlackjackGame = require('../games/blackjack');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hit')
        .setDescription('Tirer une carte au blackjack'),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const result = BlackjackGame.hit(userId);

        if (!result.success) {
            return interaction.reply({
                content: `❌ ${result.message}`,
                ephemeral: true
            });
        }

        await interaction.reply(result.message);
    }
};
