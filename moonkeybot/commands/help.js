
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Afficher l\'aide du casino'),
    
    async execute(interaction) {
        const embed = {
            color: 0x0099ff,
            title: '🎲 Aide du Casino Bot',
            description: 'Voici toutes les commandes disponibles:',
            fields: [
                {
                    name: '🎰 Jeux',
                    value: '`/slots <mise>` - Jouer aux machines à sous\n' +
                           '`/blackjack <mise>` - Jouer au blackjack\n' +
                           '`/poker <mise>` - Jouer au poker (5 cartes)\n' +
                           '`/roulette <mise> <type> [numero]` - Jouer à la roulette',
                    inline: false
                },
                {
                    name: '💰 Économie',
                    value: '`/balance [utilisateur]` - Voir votre solde ou celui d\'un autre\n' +
                           '`/daily` - Récupérer votre bonus quotidien\n' +
                           '`/pay <utilisateur> <montant>` - Envoyer des coins',
                    inline: false
                },
                {
                    name: '📊 Statistiques',
                    value: '`/jackpot` - Voir les jackpots progressifs\n' +
                           '`/leaderboard` - Voir le classement des joueurs',
                    inline: false
                },
                {
                    name: '⚙️ Administration',
                    value: '`/givemoney <utilisateur> <montant>` - Donner des coins (Admin)',
                    inline: false
                },
                {
                    name: '💡 Conseils',
                    value: '• Vous commencez avec 5000 coins\n' +
                           '• Récupérez 1000 coins gratuits chaque jour\n' +
                           '• Les jackpots progressifs augmentent à chaque partie\n' +
                           '• Misez de manière responsable!',
                    inline: false
                }
            ],
            timestamp: new Date(),
            footer: {
                text: 'Amusez-vous bien!'
            }
        };

        await interaction.reply({ embeds: [embed] });
    }
};
