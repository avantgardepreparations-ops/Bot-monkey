
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DataHandler = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('givemoney')
        .setDescription('Donner des coins à un utilisateur (Admin seulement)')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur à qui donner des coins')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant à donner')
                .setRequired(true)
                .setMinValue(1)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('utilisateur');
        const amount = interaction.options.getInteger('montant');
        const userId = targetUser.id;

        DataHandler.addToBalance(userId, amount);
        const newBalance = DataHandler.getUserBalance(userId);

        const embed = {
            color: 0x00ff00,
            title: '💰 Coins Donnés',
            description: `**${amount}** coins ont été donnés à ${targetUser}`,
            fields: [
                {
                    name: 'Nouveau solde',
                    value: `${newBalance} coins`,
                    inline: true
                }
            ],
            timestamp: new Date(),
            footer: {
                text: `Par ${interaction.user.username}`
            }
        };

        await interaction.reply({ embeds: [embed] });
    }
};
