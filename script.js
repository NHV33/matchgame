const suits = ['clubs','diamonds','hearts','spades'];
const cardRanks = ['ace','2','3','4','5','6','7','8','9','10','jack','queen','king'];
const numeric_vals = { ace:1, jack:11, queen:12, king:13 };
const colors = ["red", "blue", "green", "yellow"]

let cardNames = [];

let cards = [];
// let shuffledCards = [];
let activeCards = [];
let selectedCards = [];
let removedCards = [];
let position2Value = [];
let totalPlayers = 2;
let players = { p1: 0 };
let activePlayer = "p1";
let freeze = false;
let debugMode = false;

let buttonState = { cards: 12, players: 2 }
let buttonOptions = { cards: ["4", "12", "18", "24"], players: [1, 2, 3, 4, 5, 6, 7, 8] };

document.addEventListener('keyup', (event) => {
  if (event.key === "d") { debugMode = !debugMode; reset(); }
});

const dialog = document.querySelector("dialog");
const newGameButton = document.querySelector("#new-game");
newGameButton.addEventListener('click', () => {
  reset();
  dialog.close();
});
const cancelButton = document.querySelector("#cancel");
cancelButton.addEventListener('click', () => {
  dialog.close();
});
document.getElementById("settings").addEventListener('click', () => {
  dialog.showModal();
});
const winScreen = document.querySelector("#win-screen");
const winMessage = document.querySelector("#win-message");
document.getElementById("play-again").addEventListener('click', () => {
  reset();
  winScreen.close();
});
const gameBoard = document.querySelector("#game-board");
let nRows = 3;
let nCols = 8;
const groupSize = 2;

let gameover = false;

let cellPos = [];

function shuffleArray(array) {
    let newArray = JSON.parse(JSON.stringify(array))
    let currentIndex = newArray.length; let randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      [newArray[currentIndex], newArray[randomIndex]] = [
        newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
  }

function getNextValue(list, currentValue, increment) {
  let index = list.indexOf(currentValue);
  index += increment;
  if (index < 0) { index = list.length - 1; }
  if (index >= list.length) { index = 0; }
  return list[index];
}

function initializeArrowButtons() {
  const buttons = document.querySelectorAll(".arrow-button");
  for (const button of buttons) {
    const control = button.attributes.control.value;
    const increment = parseInt(button.attributes.increment.value, 10);
    button.addEventListener('click', () => {
      const optionText = document.getElementById(`${control}-option`);
      const nextVal = getNextValue(buttonOptions[control], buttonState[control], increment);
      buttonState[control] = nextVal;
      optionText.innerText = nextVal;
    });
  }
}

function initializePlayers() {
  const prototype = document.querySelector(".player");
  const playerBox = document.getElementById("players");
  for (let i = 2; i <= 8; i += 1) {
    const newPlayer = prototype.cloneNode(true);
    newPlayer.id = `p${i}`;
    newPlayer.classList.add(colors[(i - 1) % colors.length]);
    newPlayer.querySelector(".player-id").innerText = `P${i}`;
    newPlayer.querySelector(".player-score").id = `p${i}-score`;
    if (i > totalPlayers) {newPlayer.style.display = "none"; }
    playerBox.append(newPlayer);
    players[`p${i}`] = 0;
  }
  players["p1"] = 0;
  prototype.classList.add("red", "active");
}

function resetPlayers() {
  const playerChips = document.querySelectorAll(".player");
  for (let player of playerChips) {
    const pID = parseInt(player.id[1], 10);
    player.classList.remove("active");
    player.style.display = null;
    player.querySelector(".player-score").innerText = 0;
    if (pID > totalPlayers) {player.style.display = "none"; }
  }
  document.getElementById("p1").classList.add("active");
  for (let i = 1; i <= 8; i += 1) {
    players[`p${i}`] = 0;
  }
}

function nextPlayer() {
  const currentIndex = Object.keys(players).indexOf(activePlayer);
  document.getElementById(activePlayer).classList.remove("active");
  if (currentIndex === totalPlayers - 1) {
    activePlayer = Object.keys(players)[0];
  } else {
    activePlayer = Object.keys(players)[currentIndex + 1];
  }
  document.getElementById(activePlayer).classList.add("active");
}

function initialize() {
  initializeArrowButtons();
  initializePlayers();
  dialog.showModal();
  for (let suit of suits) {
    for (let cr of cardRanks) {
      let cardName = `${cr}_of_${suit}`;
      let cardPath = `./svg/${cardName}.svg`;
      let numeric_val = Number(cr);
      let color = 'black';
      if (['ace','jack','queen','king'].includes(cr)) {
        numeric_val = numeric_vals[cr];
      }
      if (['diamonds','hearts'].includes(suit)) {
        color = 'red';
      }
      cards.push(
        { name: cardName, path: cardPath, rank: cr, value: numeric_val, suit: suit, color: color }
      );
    }
  }
  reset();
}

function declareWinner() {
  let highest = 0;
  let winners = [];
  Object.keys(players).forEach((player) => {
    const score = players[player];
    if (score > highest) {
      highest = score;
    }
  });
  Object.keys(players).forEach((player) => {
    const score = players[player];
    if (score === highest) {
      winners.push(player);
    }
  });
  if (winners.length > 1) {
    winMessage.innerText = `This game was a tie!`;
  } else {
    winMessage.innerText = `${winners[0].toUpperCase()} is the winner!`;
  }
  winScreen.showModal();
}

function resetAllCards () {
    const cardCells = document.querySelectorAll("td");
    cardCells.forEach((cell) => {
        cell.firstElementChild.style.animation = null;
        cell.lastElementChild.style.animation = null;
    });
}

function findByPos(coord) {
    for (let item of position2Value) {
        if (item.includes(`${coord}*`)) {
            return item.split("*")[1];
        }
    }
    return null;
}

function cardsMatch () {
    let values = [];
    for (let pos of selectedCards) {
        values.push(findByPos(pos));
    }
    for (let val of values) {
        if (val !== values[0]) { return false; }
    }
    return values.length > 1;
}

function hideSelected() {
    selectedCards.forEach((cardID) => {
        document.getElementById(cardID).style.visibility = "hidden";
    });
}

function checkSelected () {
    if(cardsMatch()) {
        players[activePlayer] += 1;
        document.getElementById(`${activePlayer}-score`).innerText = players[activePlayer];
        selectedCards.forEach((selected) => {
          removedCards.push(selected);
        });
    }
    if (selectedCards.length >= groupSize) {
        freeze = true;
        setTimeout(() => {
            if (cardsMatch()) {
                hideSelected();
            } else {
                nextPlayer();
            }
            resetAllCards();
            selectedCards = [];
            freeze = false;
            if (removedCards.length === nRows * nCols) {
              declareWinner();
            }
        }, 2000);
    }
}

function setRowsCols() {
  const configurations = { "4": [2, 2], "12": [4, 3], "18": [6, 3], "24": [8, 3] };
  const config = configurations[buttonState["cards"]];
  nCols = config[0];
  nRows = config[1];
}

function reset () {
  totalPlayers = buttonState["players"];
  resetPlayers();
  activeCards = [];
  selectedCards = [];
  removedCards = [];
  position2Value = [];
  resetAllCards();
  setRowsCols();
  const totalCards = nRows * nCols;
  const totalGroups = Math.floor(totalCards / groupSize);
  const shuffledRanks = shuffleArray(cardRanks);
  const shuffledCards = shuffleArray(cards);
  for (let cardRank of shuffledRanks.slice(0, totalGroups)) {
    let count = 0;
    for (let card of shuffledCards) {
      if (String(card.rank) === String(cardRank)) {
        activeCards.push(JSON.parse(JSON.stringify(card)));
        count += 1;
      }
      if (count > 1) { break; }
    }
  }
  activeCards = shuffleArray(activeCards);
  let index = 0;
  gameBoard.innerHTML = "";
  for (let y = 0; y < nRows; y += 1) {
    const newRow = gameBoard.insertRow();
    for (let x = 0; x < nCols; x += 1) {
      const cardObj = activeCards[index];
      const svgPath = cardObj.path;
      const newCell = newRow.insertCell();
      newCell.id = `${x}-${y}`;
      newCell.className = "card";
      position2Value.push(`${newCell.id}*${cardObj.rank}`);
      const cardFace = document.createElement("div");
      cardFace.className = "card face";
      cardFace.style.backgroundImage = `url('${svgPath}')`;
      const cardBack = document.createElement("div");
      cardBack.className = "card back";
      if (debugMode) { cardBack.innerText = cardObj.rank; }
      newCell.append(cardBack, cardFace);
      newCell.addEventListener('click', () => {
        if (freeze) { return; }
        const cellPos = `${newCell.cellIndex}-${newCell.parentElement.rowIndex}`;
        if (removedCards.includes(cellPos)) { return; }
        if (selectedCards.length < 2 && !selectedCards.includes(newCell.id)) {
            selectedCards.push(cellPos);
            cardBack.style.animation = "flip-back 200ms linear 0s 1 forwards";
            cardFace.style.animation = "flip-face 200ms linear 200ms 1 forwards";
        }
        checkSelected();
      });
      index += 1;
    }
  }
}

initialize();

// const test = document.createElement("img");
// test.src = shuffledCards[6].path;
// document.body.append(test);
