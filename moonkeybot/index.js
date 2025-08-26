
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { BOT_TOKEN } = require('./config');
const fs = require('fs');
const RouletteGame = require('./games/roulette');
const BlackjackGame = require('./games/blackjack');
const PokerGame = require('./games/poker');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

client.commands = new Collection();

// Charger toutes les commandes
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Commande ${command.data.name} chargée`);
        } else {
            console.log(`⚠️  Fichier ${file} ignoré - structure invalide`);
        }
    } catch (error) {
        console.error(`❌ Erreur lors du chargement de ${file}:`, error);
    }
}

client.once('ready', () => {
    console.log(`🎲 Bot ${client.user.tag} connecté !`);
    console.log(`📊 ${client.commands.size} commandes chargées`);
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isButton()) {
            // Gestion des boutons pour les slots
            if (interaction.customId.startsWith('lock_') || 
                interaction.customId === 'cashout' || 
                interaction.customId === 'double' || 
                interaction.customId === 'quadruple') {
                const slotsCommand = client.commands.get('slots');
                if (slotsCommand) {
                    await slotsCommand.execute(interaction);
                }
            }
            // Gestion des boutons pour le blackjack
            else if (interaction.customId.startsWith('blackjack_')) {
                await BlackjackGame.handleButtonInteraction(interaction);
            }
            // Gestion des boutons pour le poker
            else if (interaction.customId.startsWith('poker_')) {
                await PokerGame.handleButtonInteraction(interaction);
            }
            // Gestion des boutons pour la roulette
            else if (interaction.customId.startsWith('roulette_spin_')) {
                await RouletteGame.spinWheel(interaction);
            }
            return;
        }

        if (interaction.isStringSelectMenu()) {
            // Gestion du menu de sélection pour la roulette
            if (interaction.customId.startsWith('roulette_select_')) {
                await RouletteGame.handleSelectMenu(interaction);
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`❌ Commande inconnue: ${interaction.commandName}`);
            return;
        }

        console.log(`🎯 ${interaction.user.tag} utilise /${interaction.commandName}`);
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Erreur lors de l'interaction:`, error);

        const errorMessage = {
            content: '❌ Une erreur est survenue lors de l\'exécution de cette commande!',
            flags: 64
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

client.login(BOT_TOKEN);
