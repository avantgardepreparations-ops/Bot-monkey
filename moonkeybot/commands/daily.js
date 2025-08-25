
const { SlashCommandBuilder } = require('discord.js');
const DataHandler = require('../utils/dataHandler');
const config = require('../config');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Récupérer votre bonus quotidien'),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        
        // Charger les données des dernières réclamations
        let dailyData = {};
        try {
            const data = fs.readFileSync('daily.json', 'utf8');
            dailyData = JSON.parse(data);
        } catch (error) {
            // Le fichier n'existe pas encore
        }

        const today = new Date().toDateString();
        const lastClaim = dailyData[userId];

        if (lastClaim === today) {
            return interaction.reply({
                content: '❌ Vous avez déjà récupéré votre bonus quotidien aujourd\'hui! Revenez demain.',
                ephemeral: true
            });
        }

        // Donner le bonus quotidien
        DataHandler.addToBalance(userId, config.DAILY_AMOUNT);
        
        // Enregistrer la réclamation
        dailyData[userId] = today;
        fs.writeFileSync('daily.json', JSON.stringify(dailyData, null, 2));

        const newBalance = DataHandler.getUserBalance(userId);

        const embed = {
            color: 0xffd700,
            title: '🎁 Bonus Quotidien',
            description: `Vous avez reçu **${config.DAILY_AMOUNT}** coins!\n\n💳 **Nouveau solde:** ${newBalance} coins`,
            thumbnail: {
                url: interaction.user.displayAvatarURL()
            },
            timestamp: new Date(),
            footer: {
                text: 'Revenez demain pour un nouveau bonus!'
            }
        };

        await interaction.reply({ embeds: [embed] });
    }
};
