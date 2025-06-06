let BotNames = ["Mark", "John", "Dave", "Martin", "Bob", "Steve", "Sam", "Smith", "Sarah", "Lois", "Park", "Alex"];

async function addBot(value, location) {
    if (location === "add-bot") {
        let playerCount = document.querySelector(".player-count");
        //Needs to call getFreeSlots()
        const response = await fetch('/api/botManager');
        const { slots, pLength } = await response.json();
        if (slots > 0) {
            playerCount.innerText = "Players: " + pLength + "/10";
            let name = BotNames[Math.floor(Math.random() * BotNames.length)];
            RemoveBotName(name);
            let cards = CreateOthers(name);// sa strane
            let userID = pLength;
            //TODO: AWAIT AND FETCH FOR THE REST OF THE CODE *UNDER*
            let botObj = new playerObject(cards, undefined, userID, name, undefined, undefined, true);
            gameState.players.push(botObj);
            onPlayerJoin();
            //--------------THE END--------------
        } else {
            console.warn("Max slots filled.");
            return;
        }
    }
}

function onPlayerJoin() {
    //This is a backend function that needs to be called
    MonitorPlayers();
    //-----------------
}

window.addBot = addBot;


function CreateOthers(name) {
    let cards = [];
    let Container = document.querySelector(".others-container");
    let othersContainer = document.createElement('div');
    othersContainer.id = 'other-container-id';

    let userP = document.createElement('p');
    userP.style.fontSize = "24px";
    userP.innerHTML = name;
    othersContainer.appendChild(userP);

    for (let i = 0; i < 2; i++) {
        let cardObj = DisplayCard(undefined);
        cards.push(cardObj);
    }
    Container.appendChild(othersContainer);
    return cards;
}

function DisplayCard(containerCall) {
    //Needs to call for gameState.deck[]
    let card = gameState.deck[gameState.currentPos++];

    if (gameState.currentPos < gameState.deck.length) {
        if (containerCall) {
            let cardContainer = document.getElementById(containerCall);
            cardContainer.appendChild(card.element);
        }
        return card;
    }
}

function RemoveBotName(name) {
    let index = BotNames.indexOf(name);
    if (index !== -1) {
        BotNames.splice(index, 1); // removes 1 element at the found index
    }
}