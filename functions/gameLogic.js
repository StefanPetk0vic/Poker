import { gameState, cardObject, playerObject } from "../script.js";

let gameInterval = null;

function MonitorPlayers() {
    if (gameState.playerCount >= 2 && !gameState.isGameRunning) {
        console.log("Game starting 2 or more joined...");
        StartGameLoop()
    } else {
        console.log("Game already in session...");
    }
}

function StartGameLoop() {
    gameState.isGameRunning=true;
    let DelayMultiplier = 1;
    CommunityDeal(3);
    gameState.players[gameState.playersPos].Cards.forEach(card => {
        setTimeout(()=>{card.FlipCard()},DelayMultiplier*250);
        DelayMultiplier++;
    });
    GameLoop();

}

function GameLoop() {
    console.log("EVOOO MEEEE");
}

function PlaceBet() { }

function CheckHands() { }

function ResetGame() { }

//opcioni com : botovi koji odu u - bice izbaceni iz gamea
function EndGame() { }


//ide od igraca do igraca i tera da donesu odluku
//event listener ceka da se izvrsi neka od 3 funk i tako u krug za sve

//za bota- kad bot treba da bira, ovde treba neki AI idk



export { GameLoop, MonitorPlayers }