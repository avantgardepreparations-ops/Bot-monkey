
const { SlashCommandBuilder } = require('discord.js');
const BlackjackGame = require('../games/blackjack');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stand')
        .setDescription('Rester avec sa main au blackjack'),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const result = BlackjackGame.stand(userId);

        if (!result.success) {
            return interaction.reply({
                content: `❌ ${result.message}`,
                ephemeral: true
            });
        }

        await interaction.reply(result.message);
    }
};
