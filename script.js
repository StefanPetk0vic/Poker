import { GameLoop } from "./functions/gameLogic.js";
// clubs (♣), diamonds (♦), hearts (♥) and spades (♠)

//#region Variables
const Types = ["♣", "♠", "♦", "♥"];
const CardNames = ["A" ,"J", "Q", "K"];
const DisplayLoc = ["community-container-id", "player-container-id", "other-container-id"];
const BotNames = ["Mark", "John", "Dave", "Martin", "Bob", "Steve"];
const PlayerStatus = ["D", "SB", "BB"]

let gameState = {
    deck: [],
    players: [],
    communityCards: [],
    betSum: 0,
    currentPos: 0,
    maxCards: 52,
    playerCount: 0,
    CardsInHand: 2
};
//#endregion

//#region Classes

class playerObject {
    constructor(cards, money, userID, name, debt, playerStatus) {
        gameState.playerCount++;
        this.Money = money ?? 1000;
        this.Cards = cards;
        this.UserID = userID ?? `Bot#${gameState.playerCount}`;
        this.Name = name ?? `Player#${gameState.playerCount}`;
        this.Debt = debt ?? 0;
        this.PlayerStatus = playerStatus;
    }
}

class cardObject {
    constructor(name, type) {
        this.Name = name;
        this.Type = type;

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
                frontFace.innerText = `${type}`;
            } else {
                frontFace.classList.add('updown-part');
                frontFace.innerText = `${name}`;
            }
            theFront.appendChild(frontFace);
        }


        this.element = cardDiv;
    }
}

//#endregion

function GenerateDeck() {
    for (let index = 2; index <= 10; index++) {
            for (let j = 0; j < Types.length; j++) {
                let Card = new cardObject(index, Types[j]);
                gameState.deck.push(Card);
        }
    }
    for (let ind = 0; ind < CardNames.length; ind++) {
        for (let j=0; j<Types.length; j++){
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
    if (gameState.currentPos < gameState.maxCards) {
        if (containerCall) {
            let cardContainer = document.getElementById(containerCall);
            cardContainer.appendChild(card.element);
        }
        return card;
    }
}


function AddBot(drawNum = 0, location) {
    let playerCount = document.querySelector(".player-count");
    if (location === "add-bot" && gameState.playerCount < 9) {
        console.log("Adding a bot with:" + drawNum + "cards");

        let name = BotNames[Math.floor(Math.random() * 5)];
        let cards = CreateOthers(name);
        let botObj = new playerObject(cards, undefined, undefined, name, undefined, undefined);
        playerCount.innerText = "Players: " + gameState.playerCount + "/10";
        gameState.players.push(botObj);

        //console.log(gameState.players);
    }
    else {
        console.warn("Something went wrong in bot-join.");
        return;
    }
}

function PlayerJoin(drawNum = 0, location) {
    let playerCount = document.querySelector(".player-count");
    if (location === "player-join") {
        console.log("Player joining with: " + drawNum + " cards");
        let cards = [];
        for (let i = 0; i < drawNum; i++) {
            let drawnCard = DisplayCard(DisplayLoc[1]);
            cards.push(drawnCard);
        }
        console.log(cards);
        //Player info won't be undefined once we add UUID and socket.io
        let playerObj = new playerObject(cards, undefined, undefined, undefined, undefined,undefined );
        gameState.players.push(playerObj);
        playerCount.innerText = "Players: " + gameState.playerCount + "/10";
        let joinBtn = document.getElementById("player-join");
        joinBtn.remove();

        //console.log("Players in this room: "+gameState.players);
    }
    else {
        console.warn("Something went wrong in player-join.");
        return;
    }
}

function CommunityDeal(drawNum = 1) {
    console.log("community cards: " + drawNum);
    for (let i = 0; i < drawNum; i++) {
        gameState.communityCards.push(DisplayCard(DisplayLoc[0]));
    }
    //console.log(gameState.communityCards);
}

function CreateOthers(name) {
    let cards = [];
    let cardContainer = document.querySelector(".others-container");
    let othersContainer = document.createElement('div');
    othersContainer.classList.add("others-card-container");
    othersContainer.id = 'other-container-id';

    let userP = document.createElement('p');
    userP.style.fontSize = "24px";
    userP.innerHTML = name;
    othersContainer.appendChild(userP);

    for (let i = 0; i < 2; i++) {
        let cardObj = DisplayCard(undefined);
        cards.push(cardObj);
        othersContainer.appendChild(cards[i].element);
    }
    cardContainer.appendChild(othersContainer);
    return cards;
}


function StartGame() {
    let popupBox = document.getElementById("starting");
    popupBox.classList.add("loading-disabled");
    GenerateDeck();
    ShuffleDeck();
    //CommunityDeal(3);
    GameLoop();
}

window.AddBot = AddBot;
window.CommunityDeal = CommunityDeal;
window.PlayerJoin = PlayerJoin;
window.StartGame = StartGame;
window.DisplayCard = DisplayCard;

export { gameState, cardObject };