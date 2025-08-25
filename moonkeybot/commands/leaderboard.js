
const { SlashCommandBuilder } = require('discord.js');
const DataHandler = require('../utils/dataHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Voir le classement des joueurs les plus riches'),
    
    async execute(interaction) {
        const balances = DataHandler.loadBalance();
        
        // Trier par solde décroissant
        const sorted = Object.entries(balances)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10

        if (sorted.length === 0) {
            return interaction.reply({
                content: '❌ Aucun joueur trouvé dans la base de données!',
                ephemeral: true
            });
        }

        let description = '';
        for (let i = 0; i < sorted.length; i++) {
            const [userId, balance] = sorted[i];
            try {
                const user = await interaction.client.users.fetch(userId);
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
                description += `${medal} ${user.displayName || user.username}: **${balance.toLocaleString()}** coins\n`;
            } catch (error) {
                // Utilisateur introuvable, ignorer
            }
        }

        // Trouver la position de l'utilisateur actuel
        const userPosition = sorted.findIndex(([userId]) => userId === interaction.user.id);
        if (userPosition !== -1) {
            description += `\n📍 **Votre position:** ${userPosition + 1}`;
        }

        const embed = {
            color: 0xffd700,
            title: '🏆 Classement des Joueurs',
            description: description || 'Aucune données disponibles',
            timestamp: new Date(),
            footer: {
                text: 'Top 10 des joueurs les plus riches'
            }
        };

        await interaction.reply({ embeds: [embed] });
    }
};
