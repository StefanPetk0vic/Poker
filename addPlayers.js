import { gameState, cardObject, playerObject, getCards, getName, getMoney } from "../script.js";

const positions = {
  1: { top: '85%', left: '50%' },
  2: { top: '85%', left: '30%' },
  3: { top: '60%', left: '10%' },
  3.5 : { top: '45%', left: '10%'},
  4: { top: '35%', left: '10%' },
  5: { top: '15%', left: '30%' },
  6: { top: '15%', left: '50%' },
  7: { top: '15%', left: '70%' },
  8: { top: '35%', left: '90%' },
  8.5: {top: '45%', left: '90%'},
  9: { top: '60%', left: '90%' },
  10: { top: '85%', left: '70%' }
};

function createPlayers(n) {
  const table = document.querySelector('.poker-table');

  let ind = 0;

  addPlayer(ind++, 1);
    
  n-=1;
  
  let top;
  let bot;
  let left;
  let right;

  if(n>=3)
  {
    top = 3;
    n-=3;

    if(n>=4)
    {
      left=2;
      right=2;

      n-=4;

      if(n!=0)
      {
        bot=n;
      }
    }
    else
    {
      left = Math.ceil(n/2);
      right = n-left;
    }
  }
  else
  {
    top = n;
  }

  if(bot>=1)
  {
    addPlayer(ind++, 2);
  }

  if(left==1)
  {
    addPlayer(ind++, 3.5);
  }
  else if(left==2)
  {
    addPlayer(ind++, 3);
    addPlayer(ind++, 4);
  }

  if(top==1)
  {
    addPlayer(ind, 6); 
  }
  else if(top==2)
  {
    addPlayer(ind++, 5);
    addPlayer(ind++, 7);
  }
  else if(top==3)
  {
    addPlayer(ind++, 5);
    addPlayer(ind++, 6);
    addPlayer(ind++, 7);
  }

  if(right==1)
  {
    addPlayer(ind++, 8.5);
  }
  else if(right==2)
  {
    addPlayer(ind++, 8);
    addPlayer(ind++, 9);
  }

  if(bot==2)
  {
    addPlayer(ind++, 10);
  }

}

function addPlayer(ind, key) {
  const table = document.querySelector('.poker-table');
  const position = positions[key];

  // Create main player container
  const playerContainer = document.createElement('div');
  playerContainer.classList.add('table-player-container');
  playerContainer.style.position = 'absolute';
  playerContainer.style.top = position.top;
  playerContainer.style.left = position.left;
  playerContainer.style.transform = 'translate(-50%, -50%)';

  const cardContainer = document.createElement('div');
  cardContainer.classList.add('table-player-card-container');

  let cards = getCards(ind);

  for (let i = 0; i < 2; i++) {
        const card = cards[i];
        // Clone the card element to avoid removing it from othersContainer
        const clonedCard = card.element.cloneNode(true);
        cardContainer.appendChild(clonedCard);
    }

  playerContainer.appendChild(cardContainer);

let moneyUser = document.createElement('div');
moneyUser.classList.add('table-player-money');
moneyUser.innerHTML =   `$${getMoney(ind)}`
playerContainer.appendChild(moneyUser);


let userP = document.createElement('div');
userP.classList.add('table-player-username');
userP.innerHTML = getName(ind);
playerContainer.appendChild(userP);

let title = document.createElement('div');
title.classList.add('table-player-title')
playerContainer.appendChild(title);


if(ind==0)
{
    title.innerHTML = "DEALER";
}
else if(ind==1)
{
    title.innerHTML = "small blind";
}
else if(ind==2)
{
    title.innerHTML = "big blind";
}


const bubble = document.createElement('div');
bubble.classList.add('bubble');
bubble.textContent="action";
bubble.id = `bubble-${getName(ind)}`;
bubble.style.opacity = 0;
playerContainer.appendChild(bubble); 

table.appendChild(playerContainer);
}


export { createPlayers }