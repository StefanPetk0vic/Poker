const gameState = require('../functions/script.js');

async function getFreeSlots(drawNum, location) {
    return new Promise(resolve => {
        const slots = gameState.playerCount - gameState.players.length + gameState.playersJoin;
        const pLength = gameState.players.length;
        resolve({ slots, pLength });
    })
}

module.exports = { getFreeSlots };



