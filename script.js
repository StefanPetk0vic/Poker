
// clubs (♣), diamonds (♦), hearts (♥) and spades (♠)

let gameState = {
    deck: [],
    betSum: 0,
    currentPos: 0,
    maxCards: 52,
    playerCount: 0,
    CardsInHand: 2
};

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

const Types = ["♣", "♠", "♦", "♥"];
const DisplayLoc = ["community-container-id", "player-container-id", "other-container-id"];
const BotNames = ["Mark", "John", "Dave"];

function GenerateDeck() {
    for (let index = 1; index <= 14; index++) {
        if (index != 11) {
            for (let j = 0; j < Types.length; j++) {
                let Card = new cardObject(index, Types[j]);
                gameState.deck.push(Card);
            }
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
    if(gameState.currentPos < gameState.maxCards){
        if (containerCall) {
            let cardContainer = document.getElementById(containerCall);
            cardContainer.appendChild(card.element);
            return cardContainer;
        }
        return card.element;
    }
}
window.DisplayCard = DisplayCard;

function StartGame() {
    let popupBox = document.getElementById("starting");
    popupBox.classList.add("loading-disabled");
    GenerateDeck();
    ShuffleDeck();
    DealCards(3, null);
}
window.StartGame = StartGame;

function DealCards(drawNum = 1, location) {
    let playerCount= document.querySelector(".player-count");
    if (location === "add-bot" && gameState.playerCount < 9) {
        console.log("Adding a bot with:" + drawNum + "cards");
        CreateOthers(BotNames[Math.floor(Math.random() * 3)]);
        gameState.playerCount++;
        playerCount.innerText = "Players: " + gameState.playerCount + "/10";
    }
    else if (location === "player-join") {
        console.log("Player joining with: " + drawNum + " cards");
        for (let i = 0; i < drawNum; i++) {
            DisplayCard(DisplayLoc[1]);
        }
        gameState.playerCount++;
        playerCount.innerText = "Players: " + gameState.playerCount + "/10";
        let joinBtn = document.getElementById("player-join");
        joinBtn.remove();
    }
    else if(location === null) {
        console.log("community cards: " + drawNum);
        for (let i = 0; i < drawNum; i++) {
            DisplayCard(DisplayLoc[0]);
        }
    }

}
window.DealCards = DealCards;

function CreateOthers(name) {
    let cardContainer = document.querySelector(".others-container");
    let othersContainer = document.createElement('div');
    othersContainer.classList.add("others-card-container");
    othersContainer.id = 'other-container-id';
    let userP = document.createElement('p');
    userP.style.fontSize="24px";
    userP.innerHTML = name;
    othersContainer.appendChild(userP);
    for (let i = 0; i < 2; i++) {
        let cards = DisplayCard();
        othersContainer.appendChild(cards);
    }
    cardContainer.appendChild(othersContainer);
}

export { gameState, cardObject };