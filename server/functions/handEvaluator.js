import { gameState, cardObject, playerObject, getUserID, ShuffleDeck, GenerateDeck, RemoveCommunityCards } from "../script.js";

const rankOrder = {
    "2": 2, "3": 3, "4": 4, "5": 5,
    "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14
};

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

export { CompareHands }