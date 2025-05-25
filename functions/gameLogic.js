import { gameState, cardObject, playerObject, getUserID, ShuffleDeck, GenerateDeck, RemoveCommunityCards } from "../script.js";
import { createPlayers, RemovePlayer } from "../addPlayers.js";

const _FALSE = false;
const _TRUE = true;
const rankOrder = {
    "2": 2, "3": 3, "4": 4, "5": 5,
    "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14
};


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

    createPlayers();

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
        HighlightWinningAfterFold(playerObject);
        ShowEndGameButtons();
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
    HighlightWinningCards(winner);
    ShowEndGameButtons();
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

                    UpdateMoney(currentPlayer.UserID, currentPlayer.Money);

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

                    UpdateMoney(currentPlayer.UserID, currentPlayer.Money);

                    currentPlayer.Bet += amount;

                    maxBet = currentPlayer.Bet;

                    UpdateMoneyPot(maxBet);

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
                if (amount == '1') ShowAction('Small blind', player.UserID);
                else if (amount == '2') ShowAction('Big blind', player.UserID);
                return;
            }
            if (action === 'call') {
                if (maxBet - player.Bet > player.Money) {
                    console.warn(`Bot ${player.Name} | ${player.UserID} has tried to bet over his allowance. Auto-folding him`);
                    resolve({ action: callActions[2], amount: 0 });
                }

                ShowAction('Call', player.UserID);
                setTimeout(() => { resolve({ action: callActions[1], amount: maxBet }); }, RoundSpeed());
            }
            if (action === 'raise') {

                let maxTotalBet = Math.min(player.Money, maxBet + 50);

                let amount = Math.floor(Math.pow(Math.random(), 2) * (maxTotalBet - maxBet)) + maxBet + 1;

                amount = Math.min(amount, player.Money);

                let raiseAmount = amount - maxBet;

                ShowAction('Raise', player.UserID, raiseAmount);

                setTimeout(() => {
                    resolve({ action: callActions[0], amount: amount });
                }, RoundSpeed());

                return;

            }
            if (action === 'fold') {
                showFold(player.UserID);
                ShowAction('Fold', player.UserID);
                setTimeout(() => { resolve({ action: callActions[2], amount: 0 }); }, RoundSpeed());
                return;

            }

            return;
        }
        else if (maxBet < 2 && FirstRound) {
            let amount = maxBet + 1;
            setTimeout(() => { resolve({ action: callActions[0], amount: amount }); }, RoundSpeed());
            if (amount == '1') ShowAction('Small blind', player.UserID);
            else if (amount == '2') ShowAction('Big blind', player.UserID);
            return;
        }
        else {

            ShowPlayerButtons();

            const callBtn = document.getElementById('call-btn-id');
            const raiseBtn = document.getElementById('raise-btn-id');
            const foldBtn = document.getElementById('fold-btn-id');

            function cleanUp() {
                callBtn.removeEventListener('click', onCall);
                raiseBtn.removeEventListener('click', onRaise);
                foldBtn.removeEventListener('click', onFold);
            }

            function onCall() {
                ShowAction("Call", player.UserID);
                cleanUp();
                HidePlayerButtons();
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
                HidePlayerButtons();
                console.log("You have raised to " + amount);
                setTimeout(() => {
                    resolve({ action: 'raise', amount: amount });
                }, 2000);
                return;

                ShowAction("Raise", player.UserID, amount);
            }

            function onFold() {
                ShowAction("Fold", player.UserID);
                showFold(player.UserID);
                cleanUp();
                HidePlayerButtons();
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

function ShowAction(action, userID, amount) {
    let bubbleId = `bubble-${userID}`;
    let bubbleElement = document.getElementById(bubbleId);

    if (action == 'Raise') {
        bubbleElement.textContent = action + " $" + amount;
    }
    else {
        bubbleElement.textContent = action;
    }

    bubbleElement.style.opacity = 100;


    setTimeout(function () {
        bubbleElement.style.opacity = '0';
    }, 1000);

}

function showFold(userID) {
    let id = `player-${userID}`;
    console.log(id + "  FOLDING");
    let playerContainer = document.getElementById(id);
    playerContainer.classList.add('folded');
    const carddContainer = playerContainer.querySelector('.table-player-card-container');
    if (carddContainer) {
        carddContainer.style.opacity = '0.3';
    }

}

function ShowTurn(userID) {
    const id = `player-${userID}`;
    const tableContainer = document.getElementById(id);

    if (tableContainer) {
        tableContainer.classList.add("turn-glow");
    }
}

function UpdateMoney(userID, Money) {
    let id = `money-${userID}`;
    let moneyElement = document.getElementById(id);
    moneyElement.textContent = "$" + Money;
}

function UpdateMoneyPot(bet) {
    let id = `money-pot`;
    let moneyPot = document.getElementById(id);
    moneyPot.textContent = "BET: $" + bet;
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

function ShowEndGameButtons() {
    const btnContainer = document.getElementById('player-btn-container-id');

    // Create Continue button
    const continueBtn = document.createElement('button');
    continueBtn.className = 'game-btn';
    continueBtn.id = 'continue-btn-id';
    continueBtn.innerText = 'CONTINUE';

    // Create Exit button
    const exitBtn = document.createElement('button');
    exitBtn.className = 'game-btn';
    exitBtn.id = 'exit-btn-id';
    exitBtn.innerText = 'EXIT';

    // Append to container
    btnContainer.appendChild(continueBtn);
    btnContainer.appendChild(exitBtn);

    // Add event listeners
    continueBtn.addEventListener('click', ContinueGame);

    exitBtn.addEventListener('click', ExitToStart);
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

async function CompareHands() {

    let activePlayers = gameState.players.filter(p => !p.HasFolded);
    await GenerateBestHand(activePlayers);
    const winner = getWinner(activePlayers);
    return winner;

}
async function getWinner(activePlayers) {

    let best = activePlayers[0];
    for (let index = 1; index < activePlayers.length; index++) {
        const current = activePlayers[index];
        if (handStrengthOrder[best.BestHand.type] < handStrengthOrder[current.BestHand.type]) {
            best = current;
        }
        else if (handStrengthOrder[best.BestHand.type] === handStrengthOrder[current.BestHand.type]) {
            const rankA = rankOrder[best.BestHand.rank];
            const rankB = rankOrder[current.BestHand.rank];
            if (rankA < rankB) {
                best = current;
            }
            else if (rankA === rankB) {
                best = await tieBreaker(best, current);
            }
        }
    }
    return best;
}
async function tieBreaker(best, current) {
    for (let index = 0; index < best.BestHand.hand.length; index++) {
        if (rankOrder[best.BestHand.hand[index].Name] > rankOrder[current.BestHand.hand[index].Name]) {
            return best;
        }
        else if (rankOrder[best.BestHand.hand[index].Name] < rankOrder[current.BestHand.hand[index].Name]) {
            return current;
        }
    }
    //TODO: return both and split the pot
    return best;
}

async function GenerateBestHand(activePlayers) {

    for (const player of activePlayers) {
        let cardsArr = [...player.Cards, ...gameState.communityCards];
        let hands = combinations(cardsArr, 5);
        player.BestHand = await evaluateHand(hands, player.Name);
        player.BestHand.hand.sort((a, b) => rankOrder[b.Name] - rankOrder[a.Name])
    }
}

const handStrengthOrder = {
    'Royal Flush': 9,
    'Straight Flush': 8,
    'Four Of A Kind': 7,
    'Full House': 6,
    'Flush': 5,
    'Straight': 4,
    'Three Of A Kind': 3,
    'Two Pair': 2,
    'Pair': 1,
    'High Card': 0
};

async function evaluateHand(hands, playerName) {
    const histoInfo = BuildHistogram(hands);
    console.log("Player: " + playerName);
    console.log("histogram-Info: ");
    console.log(histoInfo);
    console.log("-------------------------");
    const flushInfo = CheckFlush(hands);
    console.log("flush-Info: ");
    console.log(flushInfo);
    console.log("-------------------------");
    const straightInfo = CheckStraight(hands);
    console.log("straight-Info: ");
    console.log(straightInfo);
    console.log("-------------------------");
    console.log(" ");

    //###################################
    //#      Hierarchy of hands         #
    //# The best hand: Top->Bottom      #
    //###################################
    //# 1.Straight flush || royal flush # RAISE
    //#        2.Four of a kind         # RAISE
    //#        3.Full house             # RAISE
    //#        4.flush                  # RAISE/CALL
    //#        5.straight               # RAISE/CALL
    //#        6.three of a kind        # RAISE/CALL
    //#        7.two pair               # CALL
    //#        8.pair                   # CALL/FOLD
    //#        9.high card              # CALL/FOLD/FOLD
    //###################################

    // HistInfo = { rankCounts, countsSorted, byCountThenRank }
    // FlushInfo = {isFlush, type, sortRanked}
    // StraightInfo = {isStraight, highCard, ranks}

    let BestHand = null;

    //Straight Flush | Royal Flush
    flushInfo.forEach((flush, index) => {
        if (flush.isFlush && straightInfo[index].isStraight) {
            const straightFlush = {
                type: (straightInfo[index].highCard === "A") ? 'Royal Flush' : 'Straight Flush',
                rank: straightInfo[index].highCard,
                hand: hands[index],
                contributingCards: null
            };
            if (straightFlush.type === 'Royal Flush')
                straightFlush.contributingCards = GetContributingCards(hands[index], 'Royal Flush', histoInfo[index])
            else
                straightFlush.contributingCards = GetContributingCards(hands[index], 'Straight Flush', histoInfo[index])

            if (!BestHand || rankOrder[straightFlush.rank] > rankOrder[BestHand.rank]) {
                BestHand = straightFlush;
            }
        }
    });
    if (BestHand) return BestHand;

    //Four of a Kind
    histoInfo.forEach((histo, index) => {
        if (histo.countsSorted[0] === 4) {
            const fourOfAKind = {
                type: 'Four Of A Kind',
                rank: histo.byCountThenRank[0][0],
                hand: hands[index],
                contributingCards: GetContributingCards(hands[index], 'Four Of A Kind', histoInfo[index])
            }
            if (!BestHand || rankOrder[fourOfAKind.rank] > rankOrder[BestHand.rank]) {
                BestHand = fourOfAKind;
            }
        };
    })
    if (BestHand) return BestHand;

    //Full House
    histoInfo.forEach((histo, index) => {
        if ((histo.countsSorted[0] === 3) && (histo.countsSorted[1] === 2)) {
            const fullHouse = {
                type: 'Full House',
                rank: histo.byCountThenRank[0][0],
                hand: hands[index],
                contributingCards: GetContributingCards(hands[index], 'Full House', histoInfo[index])
            }
            if (!BestHand || rankOrder[fullHouse.rank] > rankOrder[BestHand.rank]) {
                BestHand = fullHouse;
            }
        };
    })
    if (BestHand) return BestHand;

    //Flush
    flushInfo.forEach((flush, index) => {
        if (flush.isFlush) {
            const flushBH = {
                type: 'Flush',
                rank: flush.sortRanked[0],
                hand: hands[index],
                contributingCards: GetContributingCards(hands[index], 'Flush', histoInfo[index])
            };
            if (!BestHand || rankOrder[flushBH.rank] > rankOrder[BestHand.rank]) {
                BestHand = flushBH;
            }
        }
    });
    if (BestHand) return BestHand;

    //Straight
    straightInfo.forEach((straight, index) => {
        if (straight.isStraight) {
            const straightBH = {
                type: 'Straight',
                rank: straight.highCard,
                hand: hands[index],
                contributingCards: GetContributingCards(hands[index], 'Straight', histoInfo[index])
            }
            if (!BestHand || rankOrder[straightBH.rank] > rankOrder[BestHand.rank]) {
                BestHand = straightBH;
            }
        }
    });
    if (BestHand) return BestHand;

    //Three Of A Kind
    histoInfo.forEach((histo, index) => {
        if (histo.countsSorted[0] === 3) {
            const threeOfAKind = {
                type: 'Three Of A Kind',
                rank: histo.byCountThenRank[0][0],
                hand: hands[index],
                contributingCards: GetContributingCards(hands[index], 'Three Of A Kind', histoInfo[index])
            }
            if (!BestHand || rankOrder[threeOfAKind.rank] > rankOrder[BestHand.rank]) {
                BestHand = threeOfAKind;
            }
        };
    })
    if (BestHand) return BestHand;

    //Two Pairs
    histoInfo.forEach((histo, index) => {
        if ((histo.countsSorted[0] === 2) && (histo.countsSorted[1] === 2)) {
            const twoPair = {
                type: 'Two Pair',
                rank: histo.byCountThenRank[0][0],
                hand: hands[index],
                contributingCards: GetContributingCards(hands[index], 'Two Pair', histoInfo[index])
            }
            if (!BestHand || rankOrder[twoPair.rank] > rankOrder[BestHand.rank]) {
                BestHand = twoPair;
            }
        };
    })
    if (BestHand) return BestHand;

    //Pair
    histoInfo.forEach((histo, index) => {
        if (histo.countsSorted[0] === 2) {
            const pair = {
                type: 'Pair',
                rank: histo.byCountThenRank[0][0],
                hand: hands[index],
                contributingCards: GetContributingCards(hands[index], 'Pair', histoInfo[index])
            }
            if (!BestHand || rankOrder[pair.rank] > rankOrder[BestHand.rank]) {
                BestHand = pair;
            }
        };
    })
    if (BestHand) return BestHand;

    //High Card
    histoInfo.forEach((histo, index) => {
        if (histo.countsSorted[0] === 1) {
            const highCard = {
                type: 'High Card',
                rank: histo.byCountThenRank[0][0],
                hand: hands[index],
                contributingCards: GetContributingCards(hands[index], 'High Card', histoInfo[index])
            }
            if (!BestHand || rankOrder[highCard.rank] > rankOrder[BestHand.rank]) {
                BestHand = highCard;
            }
        };
    })
    return BestHand;
}

function BuildHistogram(hands) {

    let Histcontainer = [];
    //mapping for easier counting of [key|value] pairs
    hands.forEach(hand => {
        const rankCounts = new Map();
        for (let index = 0; index < hand.length; index++) {
            const key = hand[index]._name.toString();
            const value = rankCounts.get(key) || 0;
            rankCounts.set(key, value + 1);
        }
        const countsSorted = [...rankCounts.values()].sort((a, b) => b - a);
        //entires converts the map into arr
        const byCountThenRank = [...rankCounts.entries()].sort((a, b) => {
            //This part checks how many pairs we have and sorts it based on that
            //e.g 3 Kings is better than 2 Aces     
            const countDiff = b[1] - a[1];
            if (countDiff !== 0) {
                return countDiff;
            }
            //Because we have [A,J,Q,K] we need a custom rank map to check the tie breaker.
            return rankOrder[b[0]] - rankOrder[a[0]];
        })
        Histcontainer.push({ rankCounts, countsSorted, byCountThenRank });
        //we return all of this info as an object for easier storage
    })
    return Histcontainer;
    //the rankCount,countsSorted,byCountThenRank will all be 21 in length
}

function CheckFlush(hands) {

    const flushContainer = [];
    hands.forEach(hand => {
        let isFlush = true;

        for (let index = 1; index < hand.length; index++) {
            if (hand[index].Type !== hand[0].Type) {
                isFlush = false;
                break;
            }

        }

        if (isFlush) {
            flushContainer.push({
                isFlush: true, type: hand[0].Type, sortRanked: hand.slice().sort((a, b) => rankOrder[b.Name] - rankOrder[a.Name]).map(hand => hand.Name)
            });
        }
        else {
            flushContainer.push({ isFlush: false, type: null, sortRanked: hand.slice().sort((a, b) => rankOrder[b.Name] - rankOrder[a.Name]).map(hand => hand.Name) })
        }
    })
    return flushContainer;
}

function CheckStraight(hands) {

    let straightContainer = [];

    hands.forEach(hand => {
        let isStraight = true;

        let handSorted = hand.slice().sort((a, b) => rankOrder[a.Name] - rankOrder[b.Name]).map(hand => hand.Name);

        for (let index = 0; index < handSorted.length - 1; index++) {
            if ((rankOrder[handSorted[index]] + 1) !== (rankOrder[handSorted[index + 1]])) {
                isStraight = false;
                break;
            }
        }
        //Check for Ace-low straight: [A,2,3,4,5]
        const isAceLow = ["A", "2", "3", "4", "5"].every(val => handSorted.includes(val));

        if (isStraight || isAceLow) {
            straightContainer.push({ isStraight: true, highCard: isAceLow ? "5" : handSorted[handSorted.length - 1], ranks: isAceLow ? ["A", "2", "3", "4", "5"] : handSorted })
        } else {
            straightContainer.push({ isStraight: false, highCard: null, ranks: null });
        }
    })

    return straightContainer;
}

const combinations = (n, k) => {
    //n - CardArr size (7)
    //k - handArr size (5)
    const combos = [];

    let head, tail;

    if (k === 1) {
        return n;
    }

    for (let i = 0; i < n.length; i++) {
        head = n.slice(i, i + 1);

        tail = combinations(n.slice(i + 1), k - 1);

        for (let j = 0; j < tail.length; j++) {
            let combo = head.concat(tail[j]);
            combos.push(combo);
        }
    }
    return combos;
}

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

function AnnounceWinner(winner) {

    DisableMoneyPot();
    DisableDealerTitle();

    let winnerAnnouncement = document.getElementById("winner");
    let winnerName = winner.Name;
    winnerAnnouncement.textContent = (winnerName === "ME") ? "You win " + "$" + gameState.betSum : winner.Name + " wins " + "$" + gameState.betSum;

    AnnounceHandType(winner);
}
function AnnounceWinnerFromFold(winner) {

    DisableMoneyPot();
    DisableDealerTitle();

    let winnerAnnouncement = document.getElementById("winner");
    let winnerName = winner.Name;
    winnerAnnouncement.textContent = (winnerName === "ME") ? "You win " + "$" + gameState.betSum : winner.Name + " wins " + "$" + gameState.betSum;
    AnnounceFoldWin();
}

function DisableMoneyPot() {
    let moneyPot = document.getElementById("money-pot");
    moneyPot.innerText = "";
}


function AnnounceHandType(winner) {
    let handType = document.getElementById("hand-type");
    handType.textContent = "·" + winner.BestHand.type + "· ";
}
function AnnounceFoldWin() {
    let handType = document.getElementById("hand-type");
    handType.textContent = "·Everyone Folded· ";
}

function DisableDealerTitle() {
    const dealer = document.querySelector("#dealer-id");
    if (dealer) {
        dealer.innerHTML = "";
    }
}
function DeleteDealerTitle(params) {
    const dealer = document.querySelector("#dealer-id");
    dealer.remove();
}

//ide od igraca do igraca i tera da donesu odluku
//event listener ceka da se izvrsi neka od 3 funk i tako u krug za sve

//za bota- kad bot treba da bira, ovde treba neki AI idk


function GetContributingCards(hand, type, histo) {
    switch (type) {
        case 'Royal Flush':
        case 'Straight Flush':
        case 'Flush':
        case 'Straight':
            return [...hand]; //vrati sve pet karte

        case 'Four Of A Kind':
            const quadRank = histo.byCountThenRank[0][0];
            return hand.filter(c => c.Name == quadRank); //filtriraj samo 4 karte sa istim rankom

        case 'Full House':
            return [...hand]; //vrati sve 5 jer je 3ranka + 2ranka

        case 'Three Of A Kind':
            const tripsRank = histo.byCountThenRank[0][0];
            return hand.filter(c => c.Name == tripsRank); // kao four of a kind

        case 'Two Pair':
            const firstPairRank = histo.byCountThenRank[0][0];
            const secondPairRank = histo.byCountThenRank[1][0];
            return hand.filter(c => c.Name == firstPairRank || c.Name == secondPairRank);

        case 'Pair':
            const pairRank = histo.byCountThenRank[0][0];
            return hand.filter(c => c.Name == pairRank);

        case 'High Card':
            return [hand.sort((a, b) => rankOrder[b.Name] - rankOrder[a.Name])[0]];

        default:
            return [];
    }
}

function HighlightWinningCards(winner) {
    DimOverlay();

    const winnerIndex = OffsetByIndex(winner);

    const contributingCards = winner.BestHand.contributingCards;

    let allCards = [...winner.Cards, ...gameState.communityCards];

    const handKey = winner.BestHand.type.toLowerCase().replace(/\s+/g, '-');

    allCards.forEach(card => {
        if (contributingCards.includes(card)) {  // Safety check
            card.setWin(true);
            card.element.classList.add(`hand--${handKey}`);
        }
        else {
            card.setDim(true);
        }
    });

    GoldWinnerBackgound(winnerIndex);
}

function HighlightWinningAfterFold(winner) {
    DimOverlay();
    let winnerIndex = OffsetByIndex(winner);
    GoldWinnerBackgound(winnerIndex);
}

function OffsetByIndex(winner) {
    let winnerIndex;
    winnerIndex = gameState.players.findIndex(player => player === winner);
    let idContainer = `player-${getUserID(winnerIndex)}`;
    let container = document.getElementById(idContainer);
    container.style.zIndex = 3;
    return winnerIndex;
}

function DimOverlay() {
    const dimoverlay = document.createElement('div');
    dimoverlay.classList.add('dim-overlay');
    document.body.appendChild(dimoverlay);
    return;
}
function GoldWinnerBackgound(winnerIndex) {
    let idUsername = `name-${getUserID(winnerIndex)}`;
    let containerUsername = document.getElementById(idUsername);
    containerUsername.style.backgroundColor = "gold";
    return;
}
function RemoveWinOverlay() {
    const dimoverlay = document.querySelector(".dim-overlay")?.remove();
    const winner = document.getElementById("winner");
    if (winner) {
        winner.innerText = "";
    }
    const hand = document.getElementById("hand-type");
    if (hand) {
        hand.innerText = "";
    }
    const exitBtn = document.getElementById("exit-btn-id")?.remove();
    const continueBtn = document.getElementById("continue-btn-id")?.remove();
}

export { GameLoop, MonitorPlayers, }