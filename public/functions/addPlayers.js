
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

function CreatePlayers() {
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

  AddPlayer(lineupIndexes[j++], 1);

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
    AddPlayer(lineupIndexes[j++], 2);
  }

  if (left == 1) {
    AddPlayer(lineupIndexes[j++], 3.5);
  }
  else if (left == 2) {
    AddPlayer(lineupIndexes[j++], 3);
    AddPlayer(lineupIndexes[j++], 4);
  }

  if (top == 1) {
    AddPlayer(lineupIndexes[j++], 6);
  }
  else if (top == 2) {
    AddPlayer(lineupIndexes[j], 5);
    AdjustZIndex(lineupIndexes[j++]);
    AddPlayer(lineupIndexes[j++], 7);
    AdjustZIndex(lineupIndexes[j++]);
   
  }
  else if (top == 3) {
    AddPlayer(lineupIndexes[j], 5);
    AdjustZIndex(lineupIndexes[j++]);
    AddPlayer(lineupIndexes[j], 6);
    AdjustZIndex(lineupIndexes[j++]);
    AddPlayer(lineupIndexes[j], 7);
    AdjustZIndex(lineupIndexes[j++]);
  }

  if (right == 1) {
    AddPlayer(lineupIndexes[j++], 8.5);
  }
  else if (right == 2) {
    AddPlayer(lineupIndexes[j++], 8);
    AddPlayer(lineupIndexes[j++], 9);
  }

  if (bot == 2) {
    AddPlayer(lineupIndexes[j++], 10);
  }

  CreateSpeechBubbles(gameState.players.length);

}

function RemovePlayer() {
  const table = document.querySelector('.poker-table');
  const players = table.querySelectorAll(".table-player-container");
  players.forEach(player => player.remove());
}

function AddPlayer(ind, key) {
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
  
  CreateCardContainer(ind, playerContainer);

  CreateInfoContainer(ind, playerContainer);

  table.appendChild(playerContainer);

}

function CreateCardContainer(ind, playerContainer)
{
  const cardContainer = document.createElement('div');
  cardContainer.classList.add('table-player-card-container');

  let cards = getCards(ind);

  for (let i = 0; i<2; i++)
  {
    const card = cards[i];
    cardContainer.appendChild(card.element);
  }

  playerContainer.appendChild(cardContainer);
}

function CreateInfoContainer(ind, playerContainer)
{
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

  AddDealerTitle(ind, title);

  playerContainer.appendChild(infoUser);
}

function AddDealerTitle(ind, title)
{
  const dealerPos = gameState.firstToAct-1;
  if(dealerPos==-1)
    dealerPos=gameState.players.length-1;

  if (getUserID(ind) == dealerPos) {
    title.innerHTML = "DEALER";
    title.id = "dealer-id";
  }
}

function CreateSpeechBubbles(numOfPlayers)
{
  for(let index = 0; index<numOfPlayers; index++)
  {
    const playerContainerId =  `player-${getUserID(index)}`;
    const playerContainer = document.getElementById(playerContainerId);

    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.textContent = "action";
    bubble.id = `bubble-${getUserID(index)}`;
    bubble.style.opacity = 0;
    bubble.classList.add('show');
    playerContainer.appendChild(bubble);
  }
}

function AdjustZIndex(index)
{
  const playerContainerId =  `player-${getUserID(index)}`;
  const playerContainer = document.getElementById(playerContainerId);
  playerContainer.style.zIndex=9;
}

//dim na 10
//community na 11