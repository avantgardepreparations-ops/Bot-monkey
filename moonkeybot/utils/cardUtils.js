
function createDeck() {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];

    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }

    return deck;
}

function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function dealCards(deck, count) {
    return deck.splice(0, count);
}

function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
        if (card.value === 'A') {
            aces++;
            value += 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }

    // Ajuster les As si nécessaire
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
}

function getHandRank(hand) {
    const values = hand.map(card => card.value);
    const suits = hand.map(card => card.suit);
    
    // Convertir les valeurs en nombres pour les comparaisons
    const numericValues = values.map(value => {
        if (value === 'A') return 14;
        if (value === 'K') return 13;
        if (value === 'Q') return 12;
        if (value === 'J') return 11;
        return parseInt(value);
    }).sort((a, b) => a - b);

    const valueCounts = {};
    values.forEach(value => {
        valueCounts[value] = (valueCounts[value] || 0) + 1;
    });

    const counts = Object.values(valueCounts).sort((a, b) => b - a);
    const isFlush = suits.every(suit => suit === suits[0]);
    const isStraight = numericValues.every((value, index) => 
        index === 0 || value === numericValues[index - 1] + 1
    );

    // Royal Flush
    if (isFlush && isStraight && numericValues[0] === 10) {
        return { name: 'Quinte Flush Royale', rank: 10 };
    }

    // Straight Flush
    if (isFlush && isStraight) {
        return { name: 'Quinte Flush', rank: 9 };
    }

    // Four of a Kind
    if (counts[0] === 4) {
        return { name: 'Carré', rank: 8 };
    }

    // Full House
    if (counts[0] === 3 && counts[1] === 2) {
        return { name: 'Full House', rank: 7 };
    }

    // Flush
    if (isFlush) {
        return { name: 'Couleur', rank: 6 };
    }

    // Straight
    if (isStraight) {
        return { name: 'Quinte', rank: 5 };
    }

    // Three of a Kind
    if (counts[0] === 3) {
        return { name: 'Brelan', rank: 4 };
    }

    // Two Pair
    if (counts[0] === 2 && counts[1] === 2) {
        return { name: 'Double Paire', rank: 3 };
    }

    // Pair of Jacks or better
    if (counts[0] === 2) {
        const pairValue = Object.keys(valueCounts).find(key => valueCounts[key] === 2);
        if (['J', 'Q', 'K', 'A'].includes(pairValue)) {
            return { name: 'Paire de Valets ou mieux', rank: 2 };
        }
        return { name: 'Paire faible', rank: 1 };
    }

    return { name: 'Carte haute', rank: 0 };
}

module.exports = {
    createDeck,
    shuffleDeck,
    dealCards,
    calculateHandValue,
    getHandRank
};
