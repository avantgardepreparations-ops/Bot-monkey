
const { SlashCommandBuilder } = require('discord.js');
const DataHandler = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pay')
        .setDescription('Envoyer des coins à un autre utilisateur')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur à qui envoyer des coins')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant à envoyer')
                .setRequired(true)
                .setMinValue(1)
        ),
    
    async execute(interaction) {
        const sender = interaction.user;
        const recipient = interaction.options.getUser('utilisateur');
        const amount = interaction.options.getInteger('montant');

        if (sender.id === recipient.id) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas vous envoyer des coins à vous-même!',
                ephemeral: true
            });
        }

        if (recipient.bot) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas envoyer des coins à un bot!',
                ephemeral: true
            });
        }

        const senderBalance = DataHandler.getUserBalance(sender.id);

        if (senderBalance < amount) {
            return interaction.reply({
                content: '❌ Vous n\'avez pas assez de coins!',
                ephemeral: true
            });
        }

        // Effectuer le transfert
        DataHandler.removeFromBalance(sender.id, amount);
        DataHandler.addToBalance(recipient.id, amount);

        const senderNewBalance = DataHandler.getUserBalance(sender.id);
        const recipientNewBalance = DataHandler.getUserBalance(recipient.id);

        const embed = {
            color: 0x00ff00,
            title: '💸 Transfert de Coins',
            description: `${sender} a envoyé **${amount}** coins à ${recipient}`,
            fields: [
                {
                    name: `Solde de ${sender.displayName || sender.username}`,
                    value: `${senderNewBalance} coins`,
                    inline: true
                },
                {
                    name: `Solde de ${recipient.displayName || recipient.username}`,
                    value: `${recipientNewBalance} coins`,
                    inline: true
                }
            ],
            timestamp: new Date(),
            footer: {
                text: 'Transfert effectué avec succès'
            }
        };

        await interaction.reply({ embeds: [embed] });
    }
};
