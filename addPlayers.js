import { gameState, cardObject, playerObject, getCards, getName, getMoney, getUserID } from "../script.js";

const positions = {
  1: { top: '85%', left: '50%' },
  2: { top: '85%', left: '30%' },
  3: { top: '70%', left: '10%' },
  3.5: { top: '50%', left: '10%' },
  4: { top: '35%', left: '10%' },
  5: { top: '15%', left: '30%' },
  6: { top: '15%', left: '50%' },
  7: { top: '15%', left: '70%' },
  8: { top: '35%', left: '90%' },
  8.5: { top: '50%', left: '90%' },
  9: { top: '70%', left: '90%' },
  10: { top: '85%', left: '70%' }
};

function createPlayers() {
  const table = document.querySelector('.poker-table');

  let numOfPlayers = gameState.players.length;
  let index = gameState.players.findIndex(p => p.Name === "ME");
  index = (index === -1) ? 0 : index;
  let lineupIndexes = [];

  if (index !== 0) {
    for (let i = index; i < numOfPlayers; i++) {
      lineupIndexes.push(i);
    }
    for (let i = 0; i < index; i++) {
      lineupIndexes.push(i);
    }
  }
  else {
    for (let i = 0; i < gameState.players.length; i++) {
      lineupIndexes.push(i);
    }
  }

  let j = 0;

  addPlayer(lineupIndexes[j++], 1);

  numOfPlayers -= 1;

  let top;
  let bot;
  let left;
  let right;

  top = (numOfPlayers >= 3) ? 3 : numOfPlayers;
  numOfPlayers = (numOfPlayers >= 3) ? numOfPlayers - 3 : 0;

  left = (numOfPlayers >= 2) ? 2 : numOfPlayers;
  numOfPlayers = (numOfPlayers >= 2) ? numOfPlayers - 2 : 0;

  right = (numOfPlayers >= 2) ? 2 : numOfPlayers;
  numOfPlayers = (numOfPlayers >= 2) ? numOfPlayers - 2 : 0;

  bot = numOfPlayers;

  if (bot >= 1) {
    addPlayer(lineupIndexes[j++], 2);
  }

  if (left == 1) {
    addPlayer(lineupIndexes[j++], 3.5);
  }
  else if (left == 2) {
    addPlayer(lineupIndexes[j++], 3);
    addPlayer(lineupIndexes[j++], 4);
  }

  if (top == 1) {
    addPlayer(lineupIndexes[j++], 6);
  }
  else if (top == 2) {
    addPlayer(lineupIndexes[j++], 5);
    addPlayer(lineupIndexes[j++], 7);
  }
  else if (top == 3) {
    addPlayer(lineupIndexes[j++], 5);
    addPlayer(lineupIndexes[j++], 6);
    addPlayer(lineupIndexes[j++], 7);
  }

  if (right == 1) {
    addPlayer(lineupIndexes[j++], 8.5);
  }
  else if (right == 2) {
    addPlayer(lineupIndexes[j++], 8);
    addPlayer(lineupIndexes[j++], 9);
  }

  if (bot == 2) {
    addPlayer(lineupIndexes[j++], 10);
  }

}

function RemovePlayer() {
  const table = document.querySelector('.poker-table');
  const players = table.querySelectorAll(".table-player-container");
  players.forEach(player => player.remove());
}

function addPlayer(ind, key) {
  const table = document.querySelector('.poker-table');
  const position = positions[key];

  const playerContainer = document.createElement('div');
  playerContainer.classList.add('table-player-container');
  playerContainer.style.position = 'absolute';
  playerContainer.style.top = position.top;
  playerContainer.style.left = position.left;
  playerContainer.style.transform = 'translate(-50%, -50%)';
  playerContainer.id = `player-${getUserID(ind)}`;

  if (getName(ind) == "ME") {
    playerContainer.classList.add('me');
  }

  const cardContainer = document.createElement('div');
  cardContainer.classList.add('table-player-card-container');

  let cards = getCards(ind);

  for (let i = 0; i < 2; i++) {
    const card = cards[i];
    // Clone the card element to avoid removing it from othersContainer
    //const clonedCard = card.element.cloneNode(true);
    cardContainer.appendChild(card.element);
  }


  playerContainer.appendChild(cardContainer);

  let infoUser = document.createElement('div');
  infoUser.classList.add('table-player-info');

  let moneyUser = document.createElement('div');
  moneyUser.classList.add('table-player-money');
  moneyUser.innerHTML = `$${getMoney(ind)}`
  moneyUser.id = `money-${getUserID(ind)}`;
  infoUser.appendChild(moneyUser);


  let userP = document.createElement('div');
  userP.classList.add('table-player-username');
  userP.innerHTML = getName(ind);
  userP.id = `name-${getUserID(ind)}`
  infoUser.appendChild(userP);

  let title = document.createElement('div');
  title.classList.add('table-player-title')
  infoUser.appendChild(title);

  playerContainer.appendChild(infoUser);


  if (getUserID(ind) == (gameState.firstToAct-1 + gameState.players.length)%gameState.players.length) {
    title.innerHTML = "DEALER";
    title.id = "dealer-id";
  }

  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  bubble.textContent = "action";
  bubble.id = `bubble-${getUserID(ind)}`;
  bubble.style.opacity = 0;
  bubble.classList.add('show');
  playerContainer.appendChild(bubble);

  //console.log(playerContainer.id +"ids");

  table.appendChild(playerContainer);

}


export { createPlayers, RemovePlayer }