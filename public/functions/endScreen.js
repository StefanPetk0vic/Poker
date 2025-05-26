import { gameState, cardObject, playerObject, getUserID, ShuffleDeck, GenerateDeck, RemoveCommunityCards } from "../script.js";

function AnnounceWinner(winner) {

    DisableMoneyPot();
    DisableDealerTitle();

    let winnerAnnouncement = document.getElementById("winner");
    let winnerName = winner.Name;
    winnerAnnouncement.textContent = (winnerName === "ME") ? "You win " + "$" + gameState.betSum : winner.Name + " wins " + "$" + gameState.betSum;

    AnnounceHandType(winner);

    HighlightWinningCards(winner);
}

function AnnounceWinnerFromFold(winner) {

    DisableMoneyPot();
    DisableDealerTitle();

    let winnerAnnouncement = document.getElementById("winner");
    let winnerName = winner.Name;
    winnerAnnouncement.textContent = (winnerName === "ME") ? "You win " + "$" + gameState.betSum : winner.Name + " wins " + "$" + gameState.betSum;
    AnnounceFoldWin();

    HighlightWinningAfterFold(winner);
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
    container.style.zIndex = 11;
    return winnerIndex;
}

function RaiseCommunityCardsOverDimOverlay()
{
    const CommunityContainer = document.getElementById("community-container-id");
    CommunityContainer.style.zIndex=12;
}

function DimOverlay() {

    RaiseCommunityCardsOverDimOverlay();

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

export { AnnounceWinner, AnnounceWinnerFromFold, RemoveWinOverlay}