import { ContinueGame, ExitToStart } from "../../server/functions/gameLogic.js";

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

function ShowFold(userID) {
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

export {ShowAction, ShowFold, ShowTurn, UpdateMoney, UpdateMoneyPot, ShowPlayerButtons, HidePlayerButtons, ShowEndGameButtons}