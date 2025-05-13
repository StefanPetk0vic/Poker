import { GameLoop, MonitorPlayers } from "./functions/gameLogic.js";
// clubs (♣), diamonds (♦), hearts (♥) and spades (♠)

//#region Variables
const Types = ["♣", "♠", "♦", "♥"];
const CardNames = ["A", "J", "Q", "K"];
const DisplayLoc = ["community-container-id", "player-container-id", "other-container-id"];
let BotNames = ["Mark", "John", "Dave", "Martin", "Bob", "Steve", "Sam", "Smith", "Sarah", "Lois", "Park", "Alex"];

let gameState = {
    //Deck - collection of shuffled cards. Max 52 cards
    deck: [],
    //currentPos -saves the current position in the deck
    currentPos: 0,
    //Players - collection of players connected to this room
    players: [],
    //CommunityCards - collection of cards on the table for easier access
    communityCards: [],
    //betSum - total sum of money on the table
    betSum: 0,
    //playersPos - remembers the frontend users pos in the arr
    playersPos: null,
    //playerCount - easier access of the number of players in the game
    playerCount: 9,
    //inCurrentGame -number of players in this game session
    inCurrentGame: 0,
    //isGameRunning -flag for controlling if there is a game in session
    isGameRunning: false,
    //firstToAct -set to 1 because the player[0] is the dealer. This is the Small Blind (SB) player the value can change
    firstToAct: 1,
    Dealer: 0,
    NumOfFolds: 0
};
//#endregion

//#region Classes
class playerObject {
    constructor(cards, money, userID, name, debt) {
        //Money - the players total money to spend
        this.Money = money ?? 1000;
        //cards - the cards the player has in his hand
        this.Cards = cards;
        //UserID - UUID or preset botID 
        this.UserID = userID;
        //Name - Self given name or default player#number
        this.Name = name ?? `Player#${gameState.players.length}`;
        this.BestHand = undefined;
        //Debt - still not realised but will be money that the player owes the "bank" and will payoff with every win 
        //(scalable value from 25% to 50% of winning earnings)
        this.Debt = debt ?? 0;
        //HasFolded - flag used for filtering out players in a game that are still playing
        this.HasFolded = false;
        //Bet - money that the player has placed in that round
        this.Bet = 0;
        //IsBot - flag used to check if a player is a bot or not
        //(used for the betting logic)
        this.IsBot = null;
        this.DebugColor = GenerateColor();
    }
}
function GenerateColor() {
    let r = 100 + Math.floor(Math.random() * 155);
    let g = 100 + Math.floor(Math.random() * 155);
    let b = 100 + Math.floor(Math.random() * 155);
    return `rgb(${r},${g},${b})`;
}
class cardObject {
    constructor(name, type) {
        this._name = name;
        this._type = type;
        this._fontColor = (type ===  "♦" || type === "♥") ? "red" : "black";
        this._frontParts = [];
        this._flipped = false;

        const cardDiv = document.createElement('div');
        cardDiv.classList.add("cards");
        

        const theBack = document.createElement('div');
        theBack.classList.add('the-back');

        const theFront = document.createElement('div');
        theFront.classList.add('the-front');

        cardDiv.appendChild(theBack);
        cardDiv.appendChild(theFront);
        for (let index = 0; index < 3; index++) {
            let frontFace = document.createElement('div');
            if (index == 1) {
                frontFace.classList.add('middle-part');
            } else {
                frontFace.classList.add('updown-part');
            }
            this._frontParts.push(frontFace);
            theFront.appendChild(frontFace);

        }
        this.element = cardDiv;
    }

    FlipCard() {
        this._frontParts.forEach(parts => {
            if (parts.classList.contains('updown-part')) {
                parts.innerText = this._name;
                parts.style.color = this._fontColor;
            }
        });
        this._frontParts.forEach(parts => {
            if (parts.classList.contains('middle-part')) {
                parts.innerText = this._type;
                parts.style.color = this._fontColor;
            }
        });
        this.element.classList.toggle('flipped');
        this._flipped = true;
    }
    get Name() {
        return this._name;
    }
    get Type() {
        return this._type;
    }
    get Flipped() {
        return this._flipped;
    }
    get FontColor() {
        return this._fontColor;
    }

    set Name(newName) {
        this._name = newName;
        this._frontParts.forEach(parts => {
            if (parts.classList.contains('updown-part')) {
                parts.innerText = newName;
            }
        });
    }
    set Type(newType) {
        this._type = newType;
        this._frontParts.forEach(parts => {
            if (parts.classList.contains('middle-part')) {
                parts.innerText = newType;
            }
        });
    }
}

function onPlayerJoin() {
    //gameState.playerCount++;
    MonitorPlayers();
}

function onPlayerLeave() {
    //gameState.playerCount--;
    MonitorPlayers();
}
//#endregion

function ShowCards() {
    gameState.players.forEach(player => {
        player.Cards.forEach(card => {
            if (!card.Flipped) {
                card.FlipCard();

            }
        })
    })
    gameState.communityCards.forEach(card => {
        if (!card.Flipped) {
            card.FlipCard();
        }
    })
}

function GenerateDeck() {
    for (let index = 2; index <= 10; index++) {
        for (let j = 0; j < Types.length; j++) {
            let Card = new cardObject(index, Types[j]);
            gameState.deck.push(Card);
        }
    }
    for (let ind = 0; ind < CardNames.length; ind++) {
        for (let j = 0; j < Types.length; j++) {
            let Card = new cardObject(CardNames[ind], Types[j]);
            gameState.deck.push(Card);
        }
    }
}

function ShuffleDeck() {
    for (let i = gameState.deck.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]]
    }
}

function DisplayCard(containerCall) {
    let card = gameState.deck[gameState.currentPos++];
    if (gameState.currentPos < gameState.deck.length) {
        if (containerCall) {
            let cardContainer = document.getElementById(containerCall);
            cardContainer.appendChild(card.element);
        }
        return card;
    }
}

function PlayerJoin(drawNum = 0, location) {
    let playerCount = document.querySelector(".player-count");
    if (location === "player-join") {
        console.log("Player joining with: " + drawNum + " cards");
        let cards = [];
        for (let i = 0; i < drawNum; i++) {
            //let drawnCard = DisplayCard(DisplayLoc[1]); ??? jel ovo nekako dodaje karte ne kapiram 
            //cards.push(drawnCard);
        }

        for (let i = 0; i < 2; i++) {
            let cardObj = DisplayCard(undefined);
            cards.push(cardObj);
            //othersContainer.appendChild(cards[i].element);
        }

        //Player info won't be undefined once we add UUID and socket.io
        let playerObj = new playerObject(cards, undefined, undefined, "ME", undefined);
        playerObj.IsBot = false;
        gameState.players.push(playerObj);
        gameState.playersPos = playerObj.userID;
        console.log("EVOOO MEEE "+gameState.players.length);
        
        playerCount.innerText = "Players: " + gameState.players.length + "/10";
        let joinBtn = document.getElementById("player-join");
        joinBtn.remove();
        onPlayerJoin();

        CreatePlayerButtons();

    }
    else {
        console.warn("Something went wrong in player-join.");
        return;
    }
}

function CreatePlayerButtons() {
    const btnContainer = document.getElementById('player-btn-container-id');

    const callBtn = document.createElement('button');
    callBtn.className = 'game-btn';
    callBtn.id = 'call-btn-id';
    callBtn.innerText = 'CALL';

    const raiseBtn = document.createElement('button');
    raiseBtn.className = 'game-btn';
    raiseBtn.id = 'raise-btn-id';
    raiseBtn.innerText = 'RAISE';

    const foldBtn = document.createElement('button');
    foldBtn.className = 'game-btn';
    foldBtn.id = 'fold-btn-id';
    foldBtn.innerText = 'FOLD';

    btnContainer.appendChild(callBtn);
    btnContainer.appendChild(raiseBtn);
    btnContainer.appendChild(foldBtn);

    callBtn.addEventListener('click', () => {
        console.log('CALL clicked');
        // resolve the action or trigger game logic here
    });

    raiseBtn.addEventListener('click', () => {
        console.log('RAISE clicked');
    });

    foldBtn.addEventListener('click', () => {
        console.log('FOLD clicked');
    });

    callBtn.style.display = 'none';
    raiseBtn.style.display = 'none';
    foldBtn.style.display = 'none';
}

async function CommunityDeal(drawNum = 1) {
    console.log("community cards: " + drawNum);
    const flipPromises = [];
    if (drawNum === 1) {
        return new Promise(resolve => {
            gameState.communityCards.push(DisplayCard(DisplayLoc[0]));
            setTimeout(() => {
                gameState.communityCards[gameState.communityCards.length - 1].FlipCard();
                resolve();
            }, 300);
            return;
        });
    }
    for (let i = 1; i <= drawNum; i++) {
        gameState.communityCards.push(DisplayCard(DisplayLoc[0]));

        // Create a Promise for each timeout to flip the card
        const flipPromise = new Promise(resolve => {
            setTimeout(() => {
                gameState.communityCards[i - 1].FlipCard();
                resolve();  // Resolve the Promise once the card is flipped
            }, 300 * i);  // Simulated delay
        });

        flipPromises.push(flipPromise);  // Store the Promise for each card
    }
    // Wait for all the flips to complete
    await Promise.all(flipPromises);
}


function AddBot(drawNum = 0, location) {
    let playerCount = document.querySelector(".player-count");
    
    if (location === "add-bot") {
        if ((gameState.playerCount - gameState.players.length ) > 0) {
           
            let name = BotNames[Math.floor(Math.random() * BotNames.length)];
            RemoveBotName(name);

            let cards = CreateOthers(name);// sa strane

            let userID = gameState.players.length;    
            let botObj = new playerObject(cards, undefined, userID, name, undefined, undefined);
            botObj.IsBot = true;
            gameState.players.push(botObj);
            playerCount.innerText = "Players: " + gameState.players.length + "/10";
            onPlayerJoin();
        }
        else {
            console.log("Max slots filled.");
            return;
        }
    }
    else {
        console.warn("Something went wrong in bot-join.");
        return;
    }
}


function RemoveBotName(name) {
    let index = BotNames.indexOf(name);
    if (index !== -1) {
        BotNames.splice(index, 1); // removes 1 element at the found index
    }
}

function CreateOthers(name) {
    let cards = [];
    let cardContainer = document.querySelector(".others-container");
    let othersContainer = document.createElement('div');
    //othersContainer.classList.add("others-card-container");
    othersContainer.id = 'other-container-id';

    let userP = document.createElement('p');
    userP.style.fontSize = "24px";
    userP.innerHTML = name;
    othersContainer.appendChild(userP);

    for (let i = 0; i < 2; i++) {
        let cardObj = DisplayCard(undefined);
        cards.push(cardObj);
        //othersContainer.appendChild(cards[i].element);
    }
    cardContainer.appendChild(othersContainer);
    return cards;
}

function RemoveLoading() {
    let popupBox = document.getElementById("starting-container-id");
    popupBox.classList.add("loading-disabled");
    GenerateDeck();
    ShuffleDeck();
}

function getCards(index) {
    return gameState.players[index].Cards;
}

function getName(index) {
    return gameState.players[index].Name;
}

function getMoney(index) {
    return gameState.players[index].Money;
}

function getUserID(index)
{
    return gameState.players[index].UserID;
}


window.RemoveLoading = RemoveLoading;
window.AddBot = AddBot;
window.CommunityDeal = CommunityDeal;
window.PlayerJoin = PlayerJoin;
window.DisplayCard = DisplayCard;
window.ShowCards = ShowCards;

export { gameState, cardObject, ShowCards, playerObject, getCards, getName, getMoney, getUserID };