import { gameState, cardObject, playerObject } from "../script.js";
import { createPlayers } from "../addPlayers.js";

const _FALSE = false;
const _TRUE = true;

function MonitorPlayers() {
    if (gameState.players.length === 2 && !gameState.isGameRunning) {
        let StartButton = document.createElement('button');
        StartButton.classList.add("main-btn");
        StartButton.innerText = "START";
        StartButton.addEventListener('click', StartGameLoop);
        const CommunityContainer = document.getElementById('community-container-id');
        CommunityContainer.appendChild(StartButton);
    } else {
        console.log("Game already in session or not enough players...");
    }
}

function StartGameLoop() {
    const startBtn = document.querySelector('#community-container-id .main-btn');
    if (startBtn) startBtn.remove();

    RemoveJoinButton();

    createPlayers(gameState.players.length);
    console.log("trying");

    gameState.isGameRunning = true;
    let DelayMultiplier = 1;
    if (gameState.playersPos != undefined) {
        gameState.players[gameState.playersPos].Cards.forEach(card => {
            setTimeout(() => { card.FlipCard() }, DelayMultiplier * 250);
            DelayMultiplier++;
        });
    }
    GameLoop();
}

function RemoveJoinButton()
{
    const playerJoinButton = document.getElementById('player-join');
    if (playerJoinButton) {
        playerJoinButton.style.display = 'none';
    }
}

async function GameLoop() {
    await PlaceBets(true);
    await CommunityDeal(3);

    let BreakFlag = await BreakGame();
    console.log("breakFlag check:" + BreakFlag);
    if (BreakFlag) {
        console.log("Finished in the 1st round");
        await ResetGame();
        await EndGame();
        return;
    }
    await PlaceBets();
    await CommunityDeal();

    BreakFlag = await BreakGame();
    console.log("breakFlag check:" + BreakFlag);

    if (BreakFlag) {
        console.log("Finished in the 2nd round");
        await ResetGame();
        await EndGame();
        return;
    }
    await PlaceBets();
    await CommunityDeal();

    await CheckHands();
    await ResetGame();
    await EndGame();
}
async function BreakGame() {
    return new Promise(resolve => {
        let activePlayers = gameState.players.filter(p => !p.HasFolded);
        if (activePlayers.length <= 1) {
            console.log("ActivePlayer check for true: " + activePlayers.length);
            resolve(true);
            return;
        }
        console.log("ActivePlayer check for false: " + activePlayers.length);
        resolve(false);
        return;
    })
}
async function PlaceBets(FirstRound = false) {

    //activePlayers - arr of all the players that didnt fold
    let activePlayers = gameState.players.filter(p => !p.HasFolded);
    //currentIndex - value based from the firstToAct variable that will be incremented to match the new SB
    //In the 2nd and 3rd rounds the 1st player to act is the one on the left of the dealer a.k.a firstToAct
    //let DealerFlag = activePlayers.find(p => p.UserID === "Bot#0");
    let currentIndex = gameState.firstToAct;
    
    console.log("Checking currentIndex at the start with firstRound: " + currentIndex);

    //maxBet - the value of the current max bet
    let maxBet = 0;
    //lastToRaiseIndex - we track the last person to raise

    let lastToRaiseIndex = (FirstRound) ? -1 : ((currentIndex + activePlayers.length) % activePlayers.length);

    while (activePlayers.length > 1) {
        //currentPlayer - object from the arr that will be placed in the current betting
        const currentPlayer = activePlayers[currentIndex];

        if (currentPlayer.HasFolded) {
            currentIndex = (currentIndex + 1) % activePlayers.length;
            console.log("%c The hasFolded check just to see if it ever prints", "color:red;font-size:32px");
            continue;
        }

        const { action, amount } = await getPlayerAction(currentPlayer, maxBet, FirstRound);

        switch (action) {
            case 'fold':
                currentPlayer.HasFolded = true;
                gameState.NumOfFolds++;
                console.log("-----------------------------------");
                console.log(
                    `%cThe bot has folded: ${currentPlayer.Name} | ${currentPlayer.UserID}`,
                    `color: ${currentPlayer.DebugColor}; font-size: 12px;`
                );
                console.log("-----------------------------------");
                console.log(" ");

                break;
            case 'call':
                if (currentPlayer.Money >= amount) {
                    currentPlayer.Money -= (amount - currentPlayer.Bet);
                    currentPlayer.Bet += (amount - currentPlayer.Bet);
                    console.log("-----------------------------------");
                    console.log(
                        `%cThe bot has called: ${currentPlayer.Name} | ${currentPlayer.UserID}`,
                        `color: ${currentPlayer.DebugColor}; font-size: 12px;`
                    ); console.log("Money: " + currentPlayer.Money);
                    console.log("Total bet: " + currentPlayer.Bet + " | Current Max Bet: " + maxBet);
                    console.log("-----------------------------------");
                    console.log(" ");

                }
                else {
                    currentPlayer.HasFolded = true;
                    gameState.NumOfFolds++;

                }
                break;
            case 'raise':
                if (currentPlayer.Money >= amount) {
                    currentPlayer.Money -= amount;
                    currentPlayer.Bet += amount;
                    maxBet = currentPlayer.Bet;
                    lastToRaiseIndex = currentIndex;
                    console.log("-----------------------------------");
                    console.log(
                        `%cThe bot has raised: ${currentPlayer.Name} | ${currentPlayer.UserID}`,
                        `color: ${currentPlayer.DebugColor}; font-size: 12px;`
                    ); console.log("Money: " + currentPlayer.Money);
                    console.log("raised amount: " + amount);
                    console.log("Total bet: " + currentPlayer.Bet + " | Current Max Bet: " + maxBet);
                    console.log("-----------------------------------");
                    console.log(" ");

                }
                else {
                    currentPlayer.HasFolded = true;
                    gameState.NumOfFolds++;
                }
                break;
        }
        //Checking again if there is still active players
        activePlayers = gameState.players.filter(p => !p.HasFolded);
        console.log("SOMETHING IS SUS HERE WAULTHR " + activePlayers.length);

        //Check if betting is done: if the next player is the one who raised last
        if (activePlayers.length <= 1) break;
        if (action !== 'fold') {
            currentIndex = currentIndex + 1;
        } else {
            if(currentIndex === 0){
            gameState.firstToAct = (gameState.firstToAct === 0) ? gameState.firstToAct : gameState.firstToAct-1;
            }
            if(currentIndex < lastToRaiseIndex){
                lastToRaiseIndex = (lastToRaiseIndex !== 0) ? lastToRaiseIndex - 1 : lastToRaiseIndex;
            }
        }
        currentIndex = currentIndex % activePlayers.length;
        console.log(" ");
        console.log("-------------------------------");
        console.log(`%cCheck for next playerIndex: ` + currentIndex, `color: yellow; font-size: 12px;`);
        console.log(`%cLast to raise: ` + lastToRaiseIndex, `color: yellow; font-size: 12px;`);
        console.log("-------------------------------");
        console.log(" ");
        if (currentIndex === lastToRaiseIndex) {
            let allMatched = activePlayers.every(p => p.Bet === maxBet);
            if (allMatched) break;
        }
    }
    gameState.players.forEach(player=>{
        gameState.betSum+=player.Bet;
        player.Bet = 0;
    });
    //TODO: fix the player.Bet vaules. Return them all to 0
};

function getPlayerAction(player, maxBet, FirstRound) {
    return new Promise(resolve => {
        const callActions = ['raise', 'call', 'fold', 'call', 'call', 'call'];
        if (player.IsBot) {
            const action = callActions[Math.floor(Math.random() * callActions.length)];
            ShowAction(action, player.Name);
            if (maxBet < 2 && FirstRound) {
                let amount = maxBet + 1;
                setTimeout(() => { resolve({ action: callActions[0], amount: amount }); }, RoundSpeed());
                return;
            }
            if (action === 'call') {
                if (maxBet - player.Bet > player.Money) {
                    console.warn(`Bot ${player.Name} | ${player.UserID} has tried to bet over his allowance. Auto-folding him`);
                    resolve({ action: callActions[2], amount: 0 });
                }
                setTimeout(() => { resolve({ action: callActions[1], amount: maxBet }); }, RoundSpeed());
                return;
            }
            if (action === 'raise') {
                let maxRaise = Math.min(player.Money, maxBet + 50);
                let amount = Math.floor(Math.pow(Math.random(), 2) * maxRaise);
                amount = Math.max(amount, maxBet + 1);
                if (amount > player.Money) {
                    console.warn(`Bot ${player.Name} | ${player.UserID} has tried to bet over his allowance. Auto-folding him`);
                    resolve({ action: callActions[2], amount: 0 });
                }
                setTimeout(() => { resolve({ action: callActions[0], amount: amount }); }, RoundSpeed());
                return;
            }
            if (action === 'fold') {
                setTimeout(() => { resolve({ action: callActions[2], amount: 0 }); }, RoundSpeed());
                return;
            }
        }
        else{

            ShowPlayerButtons();

            const callBtn = document.getElementById('call-btn-id');
            const raiseBtn = document.getElementById('raise-btn-id');
            const foldBtn = document.getElementById('fold-btn-id');

            function cleanUp()
            {
                callBtn.removeEventListener('click', onCall);
                raiseBtn.removeEventListener('click', onRaise);
                foldBtn.removeEventListener('click', onFold);
            }

            function onCall()
            {
                cleanUp();
                HidePlayerButtons();
                console.log("You have called.");
                resolve({action:'call', amount: maxBet});
            }

            function onRaise()
            {
                cleanUp()

                let amount;

                while(true)
                {
                    amount = prompt("Enter your raise amount:");
                    amount = parseInt(amount);

                    if(isNaN(amount)) alert("Invalid raise amount. Not a number.");
                    else if(amount <=maxBet) alert("Invalid raise amount. Not a number.");
                    else break;
                }
                HidePlayerButtons();
                console.log("You have raised to " + amount);
                resolve({action: 'raise', amount: amount});
            }

            function onFold()
            {
                cleanUp();
                HidePlayerButtons();
                console.log("You have folded");
                resolve({action:'fold', amount: 0});
            }
            
            callBtn.addEventListener('click', onCall);
            raiseBtn.addEventListener('click', onRaise);
            foldBtn.addEventListener('click', onFold);


        }
    })
}

function ShowAction(action, Name)
{
    let bubbleId=`bubble-${Name}`;
    let bubbleElement = document.getElementById(bubbleId);

    bubbleElement.textContent = action; 
    bubbleElement.style.opacity=100;

    setTimeout(function () {
            bubbleElement.style.opacity = '0';
        }, 1000);

    
}
    

function ShowPlayerButtons() {
    const callBtn = document.getElementById('call-btn-id');
    const raiseBtn = document.getElementById('raise-btn-id');
    const foldBtn = document.getElementById('fold-btn-id');

    callBtn.style.display = 'block';
    raiseBtn.style.display = 'block';
    foldBtn.style.display = 'block';

}

function HidePlayerButtons() {
    const callBtn = document.getElementById('call-btn-id');
    const raiseBtn = document.getElementById('raise-btn-id');
    const foldBtn = document.getElementById('fold-btn-id');

    callBtn.style.display = 'none';
    raiseBtn.style.display = 'none';
    foldBtn.style.display = 'none';
}


function RoundSpeed(Active = true) {
    if(Active){
        //return 1000 + Math.floor(Math.random() * 5000); mnnogo sporo cekam celu vecnost
        return 1000;
    }
    return 0;
}
async function CheckHands() {
    return new Promise(resolve => {
        console.log("CHECKING HANDS");
        resolve(true);
        return;

    })
}
function showActionBtn() {

}

async function ResetGame() {
    console.log("RESET GAME");

}

//opcioni com : botovi koji odu u - bice izbaceni iz gamea
async function EndGame() {
    console.log("END GAME");
    gameState.firstToAct++;

}



//ide od igraca do igraca i tera da donesu odluku
//event listener ceka da se izvrsi neka od 3 funk i tako u krug za sve

//za bota- kad bot treba da bira, ovde treba neki AI idk



export { GameLoop, MonitorPlayers,  }