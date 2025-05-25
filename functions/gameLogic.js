import { gameState, cardObject, playerObject, getUserID, ShuffleDeck, GenerateDeck, RemoveCommunityCards } from "../script.js";
import { CreatePlayers, RemovePlayer } from "../addPlayers.js";
import * as uiEffects from "../uiEffects.js";
import { CompareHands } from "../handEvaluator.js";
import { AnnounceWinner, AnnounceWinnerFromFold, RemoveWinOverlay} from "../endScreen.js"

const _FALSE = false;
const _TRUE = true;


function MonitorPlayers() {
    console.log(gameState.players.length);
    console.log(gameState.isGameRunning);

    if ((gameState.players.length >= 2) && (!gameState.isGameRunning)) {
        if (document.querySelector(".main-btn") === null) {
            let StartButton = document.createElement('button');
            StartButton.classList.add("main-btn");
            StartButton.innerText = "START";
            StartButton.addEventListener('click', StartGameLoop);
            const CommunityContainer = document.getElementById('community-container-id');
            CommunityContainer.appendChild(StartButton);
        }
    } else {
        console.log("Game already in session or not enough players...");
    }
}

function StartGameLoop() {

    console.log("Game Started");

    const startBtn = document.querySelector('#community-container-id .main-btn');
    if (startBtn) startBtn.remove();

    RemoveJoinButton();

    CreatePlayers();

    gameState.isGameRunning = true;
    let DelayMultiplier = 1;
    if (gameState.playersPos != undefined) {
        gameState.players[gameState.playersPos].Cards.forEach(card => {
            setTimeout(() => { card.FlipCard() }, DelayMultiplier * 250);
            DelayMultiplier++;
        });
    }
    FoldReset();
    GameLoop();

}
function FoldReset() {
    gameState.players.forEach(player => {
        player.HasFolded = false;
    })
}

function RemoveJoinButton() {
    const playerJoinButton = document.getElementById('player-join');
    if (playerJoinButton) {
        playerJoinButton.style.display = 'none';
    }
}

async function GameLoop() {

    await new Promise(resolve => { setTimeout(resolve, 1500) });
    await PlaceBets(true);

    let breakFlag = EarlyEndCheck();
    if (breakFlag === true) {
        return;
    }

    await CommunityDeal(3);

    await new Promise(resolve => { setTimeout(resolve, 1500) });
    await PlaceBets();

    breakFlag = EarlyEndCheck();
    if (breakFlag === true) {
        return;
    }

    await CommunityDeal();

    await new Promise(resolve => { setTimeout(resolve, 1500) });
    await PlaceBets();

    breakFlag = EarlyEndCheck();
    if (breakFlag === true) {
        return;
    }

    await CommunityDeal();

    await new Promise(resolve => { setTimeout(resolve, 1500) });
    await PlaceBets();

    breakFlag = EarlyEndCheck();
    if (breakFlag === true) {
        return;
    }

    await EndCheck();
}
function BreakGame() {

    let activePlayers = gameState.players.filter(p => !p.HasFolded);
    if (activePlayers.length <= 1) {
        console.log("ActivePlayer check for true: " + activePlayers.length);
        return ({ flag: true, playerObject: activePlayers[0] });

    }
    console.log("ActivePlayer check for false: " + activePlayers.length);
    return ({ flag: false, playerObject: null });

}

function EarlyEndCheck() {
    let { flag, playerObject } = BreakGame();
    console.log("break game flag triggered: " + flag);
    if (flag) {
        console.log("Game finished after the 1st round");

        EndGame(null, true);
        ShowCards();

        AnnounceWinnerFromFold(playerObject);

        uiEffects.ShowEndGameButtons();
        return true;
    }
    return false;
}

async function EndCheck() {
    const winner = await CompareHands();
    EndGame(winner, false);

    ShowCards();

    await new Promise(resolve => setTimeout(resolve, 1500));

    AnnounceWinner(winner);
    uiEffects.ShowEndGameButtons();
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

    let lastToRaiseIndex = -1;

    activePlayers.forEach(player => {
        player.hasPlayedBefore = false;
    });

    while (activePlayers.length > 1) {
        //currentPlayer - object from the arr that will be placed in the current betting
        const currentPlayer = activePlayers[currentIndex];
        console.log("EVOOO MEEE U WHILE");
        console.log(activePlayers[currentIndex]);
        console.log("----------------------");
        console.log(" ");

        const { action, amount } = await getPlayerAction(currentPlayer, maxBet, FirstRound);

        currentPlayer.hasPlayedBefore = true;

        switch (action) {
            case 'fold':
                currentPlayer.HasFolded = true;
                gameState.NumOfFolds++;
                console.log("-----------------------------------");
                console.log(
                    `%cThe bot has folded: ${currentPlayer.UserID} | ${currentPlayer.UserID}`,
                    `color: ${currentPlayer.DebugColor}; font-size: 12px;`
                );
                console.log("-----------------------------------");
                console.log(" ");

                break;
            case 'call':
                if (currentPlayer.Money >= amount) {
                    currentPlayer.Money -= (amount - currentPlayer.Bet);

                    uiEffects.UpdateMoney(currentPlayer.UserID, currentPlayer.Money);

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

                    uiEffects.UpdateMoney(currentPlayer.UserID, currentPlayer.Money);

                    currentPlayer.Bet += amount;

                    maxBet = currentPlayer.Bet;

                    uiEffects.UpdateMoneyPot(maxBet);

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
            if (currentIndex === 0) {
                //Im changing firstToAct because im trying to keep it consistant with the left of dealer to play first
                gameState.firstToAct = (gameState.firstToAct === 0) ? gameState.firstToAct : gameState.firstToAct - 1;
                //TODO: a u kurac
            }
            if (currentIndex < lastToRaiseIndex) {
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
        //TODO: add a check if everyone has played at least once.

        if ((currentIndex === lastToRaiseIndex)) {
            let allMatched = activePlayers.every(p => p.Bet === maxBet);
            if (allMatched) break;
        }

        const everyonePlayedOnce = activePlayers.every(p => p.hasPlayedBefore);
        const allMatched = activePlayers.every(p => p.Bet === maxBet);
        if (everyonePlayedOnce && allMatched)
            break;

    }


    gameState.players.forEach(player => {
        gameState.betSum += player.Bet;
        player.Bet = 0;
    });
};

function getPlayerAction(player, maxBet, FirstRound) {
    return new Promise(resolve => {
        const callActions = ['raise', 'call', 'fold', 'call', 'call', 'call'];
        if (player.IsBot) {
            const action = callActions[Math.floor(Math.random() * callActions.length)];

            //ShowTurn(player.UserID);
            if (maxBet < 2 && FirstRound) {
                let amount = maxBet + 1;
                setTimeout(() => { resolve({ action: callActions[0], amount: amount }); }, RoundSpeed());
                if (amount == '1') uiEffects.ShowAction('Small blind', player.UserID);
                else if (amount == '2') uiEffects.ShowAction('Big blind', player.UserID);
                return;
            }
            if (action === 'call') {
                if (maxBet - player.Bet > player.Money) {
                    console.warn(`Bot ${player.Name} | ${player.UserID} has tried to bet over his allowance. Auto-folding him`);
                    resolve({ action: callActions[2], amount: 0 });
                }

                uiEffects.ShowAction('Call', player.UserID);
                setTimeout(() => { resolve({ action: callActions[1], amount: maxBet }); }, RoundSpeed());
            }
            if (action === 'raise') {

                let maxTotalBet = Math.min(player.Money, maxBet + 50);

                let amount = Math.floor(Math.pow(Math.random(), 2) * (maxTotalBet - maxBet)) + maxBet + 1;

                amount = Math.min(amount, player.Money);

                let raiseAmount = amount - maxBet;

                uiEffects.ShowAction('Raise', player.UserID, raiseAmount);

                setTimeout(() => {
                    resolve({ action: callActions[0], amount: amount });
                }, RoundSpeed());

                return;

            }
            if (action === 'fold') {
                uiEffects.ShowFold(player.UserID);
                uiEffects.ShowAction('Fold', player.UserID);
                setTimeout(() => { resolve({ action: callActions[2], amount: 0 }); }, RoundSpeed());
                return;

            }

            return;
        }
        else if (maxBet < 2 && FirstRound) {
            let amount = maxBet + 1;
            setTimeout(() => { resolve({ action: callActions[0], amount: amount }); }, RoundSpeed());
            if (amount == '1') uiEffects.ShowAction('Small blind', player.UserID);
            else if (amount == '2') uiEffects.ShowAction('Big blind', player.UserID);
            return;
        }
        else {

            uiEffects.ShowPlayerButtons();

            const callBtn = document.getElementById('call-btn-id');
            const raiseBtn = document.getElementById('raise-btn-id');
            const foldBtn = document.getElementById('fold-btn-id');

            function cleanUp() {
                callBtn.removeEventListener('click', onCall);
                raiseBtn.removeEventListener('click', onRaise);
                foldBtn.removeEventListener('click', onFold);
            }

            function onCall() {
                uiEffects.ShowAction("Call", player.UserID);
                cleanUp();
                uiEffects.HidePlayerButtons();
                console.log("You have called.");
                setTimeout(() => {
                    resolve({ action: 'call', amount: maxBet });
                }, 2000);

            }

            function onRaise() {


                let amount;

                while (true) {
                    amount = prompt("Enter your raise amount:");
                    if (amount === null) {
                        console.log("Raise cancelled.");
                        return;
                    }
                    amount = parseInt(amount);

                    if (isNaN(amount)) alert("Invalid raise amount. Not a number.");
                    else if (amount <= maxBet) alert("Invalid raise amount. Not a number.");
                    else break;
                }
                cleanUp()
                uiEffects.HidePlayerButtons();
                console.log("You have raised to " + amount);
                setTimeout(() => {
                    resolve({ action: 'raise', amount: amount });
                }, 2000);
                return;

                ShowAction("Raise", player.UserID, amount);
            }

            function onFold() {
                uiEffects.ShowAction("Fold", player.UserID);
                uiEffects.ShowFold(player.UserID);
                cleanUp();
                uiEffects.HidePlayerButtons();
                console.log("You have folded");
                setTimeout(() => {
                    resolve({ action: 'fold', amount: 0 });
                }, 2000);
            }

            callBtn.addEventListener('click', onCall);
            raiseBtn.addEventListener('click', onRaise);
            foldBtn.addEventListener('click', onFold);


        }
    })
}



function ContinueGame() {
    ResetGameState();
    if (gameState.players.length >= 2) {
        console.log("CONTINUE");
        StartGameLoop();
        return;
    }
    MonitorPlayers();

}
function ExitToStart() {
    ResetGameState();
    MonitorPlayers();
}

function ResetGameState() {
    gameState.firstToAct = (gameState.firstToAct + 1) % gameState.players.length;
    gameState.betSum = 0;
    gameState.currentPos = 0;
    gameState.deck = [];
    gameState.isGameRunning = false;
    RemoveCommunityCards();
    GenerateDeck();
    ShuffleDeck();
    RemovePlayer();
    RemoveWinOverlay();
    gameState.players.forEach(player => {
        player.HasFolded = false;
        player.Debt = 0;
        player.Bet = 0;
        player.BestHand = undefined;
        for (let index = 0; index < player.Cards.length; index++) {
            player.Cards[index] = gameState.deck[gameState.currentPos++];
        }
    });
}


function RoundSpeed(Active = true) {
    if (Active) {
        return 1000 + Math.floor(Math.random() * 1500);
    }
    return 0;
}

//type: "Royal Flush"
//rank: highCard -> "A"
//hand: [10,J,Q,K,A]

//opcioni com : botovi koji odu u - bice izbaceni iz gamea
function EndGame(winnerPtr, Flag) {
    let winner;
    if (Flag) {
        let player = gameState.players.filter(p => !p.HasFolded)
        winner = player[0];
    } else {
        winner = winnerPtr;
    }
    //TODO: fix the missing money (If adding "winner.Debt" didn't fix it)
    //Msm da moramo da vratimo pare vidim da pobedniku fale tkd nisam duboko se zagledao u ovaj bug
    winner.Money += gameState.betSum + winner.Debt;
    console.log("-------END GAME---------");
    console.log("The winner is: " + winner.Name);
    console.log("total winnings: " + gameState.betSum);
    console.log("------------------------");
    console.log(winner);
    console.log("---------Debug----------");
}

export { GameLoop, MonitorPlayers, ContinueGame, ExitToStart }