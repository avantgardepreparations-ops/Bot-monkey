
const { SlashCommandBuilder } = require('discord.js');
const DataHandler = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jackpot')
        .setDescription('Voir les jackpots progressifs actuels'),
    
    async execute(interaction) {
        const jackpots = DataHandler.loadJackpots();

        const embed = {
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
                    name: '🎲 Roulette',
                    value: `${jackpots.roulette.toLocaleString()} coins`,
                    inline: true
                }
            ],
            footer: {
                text: 'Les jackpots augmentent à chaque partie jouée!'
            },
            timestamp: new Date()
        };

        await interaction.reply({ embeds: [embed] });
    }
};
