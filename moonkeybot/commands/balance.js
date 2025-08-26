
const { SlashCommandBuilder } = require('discord.js');
const DataHandler = require('../utils/dataHandler');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Vérifier votre solde')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('Voir le solde d\'un autre utilisateur')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
        const userId = targetUser.id;

        let balance = DataHandler.getUserBalance(userId);
        
        // Donner le solde initial si c'est un nouveau joueur
        if (balance === 0 && targetUser.id === interaction.user.id) {
            balance = config.INITIAL_BALANCE;
            DataHandler.setUserBalance(userId, balance);
        }

        const embed = {
            color: 0x00ff00,
            title: '💰 Solde du Casino',
            description: `**${targetUser.displayName || targetUser.username}** possède **${balance}** coins`,
            thumbnail: {
                url: targetUser.displayAvatarURL()
            },
            timestamp: new Date(),
            footer: {
                text: 'Casino Bot'
            }
        };

        await interaction.reply({ embeds: [embed] });
    }
};
