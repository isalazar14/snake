const SETTINGS = {
  gridSize: 30,
  refreshInterval: 100 /* ms */,
};

document.documentElement.style.setProperty("--gridSize", SETTINGS.gridSize);

/**
 * @typedef {Object} Position
 * @property {number|undefined} row - The row position.
 * @property {number|undefined} col - The column position.
 */

/**
 * @typedef {'up' | 'down' | 'left' | 'right'} Direction
 */

/**
 * @typedef {Object} SnakeSegment
 * @property {HTMLDivElement} el
 * @property {number} row
 * @property {number} col
 */

/**
 * @type {{
 *   isGameStarted: boolean,
 *   isGameRunning: boolean,
 *   isGameOver: boolean,
 *   foodPosition: Position,
 *   curDirection: Direction|undefined,
 *   newDirection: Direction|undefined,
 *   snake: SnakeSegment[],
 *   refreshIntervalId: number|undefined,
 *   _score: number,
 *   _highScore: number
 * }}
 */
const STATE = {
  isGameStarted: false,
  isGameRunning: false,
  isGameOver: false,
  foodPosition: { row: undefined, col: undefined },
  curDirection: undefined,
  newDirection: undefined,
  snake: [],
  refreshIntervalId: undefined,
  _score: 0,
  get score() {
    return this._score;
  },
  set score(newScore) {
    this._score = newScore;
    document.querySelector("#currentScore").textContent = newScore;
    if (newScore > this.highScore) {
      this.highScore = newScore;
    }
  },
  _highScore: 0,
  get highScore() {
    return this._highScore;
  },
  set highScore(newHighScore) {
    this._highScore = newHighScore;
    document.querySelector("#highScore").textContent = newHighScore;
    localStorage.setItem("highScore", newHighScore);
  },
};

const board = document.querySelector(".board");

function makeDivWithClassName(className) {
  const div = document.createElement("div");
  div.className = className;
  return div;
}

function getRandomGridCoord() {
  return Math.floor(Math.random() * SETTINGS.gridSize) + 1;
}

function getRandomBoardRowCol() {
  const col = getRandomGridCoord(),
    row = getRandomGridCoord();
  return { row, col };
}

/**
 * Checks if the specified position is occupied.
 * @param {Object} position - The position object.
 * @param {number} position.row - The row of the position.
 * @param {number} position.col - The column of the position.
 */
function isOccupied({ row, col }) {
  if (!row || !col) return new Error("Missing coordinate.");
  return STATE.snake.some(
    (section) => section.row == row && section.col == col
  );
}

/**
 * @param {HTMLDivElement} el
 * @param {number} col
 * @param {number} row
 * @returns {void}
 */
function placeOnBoard(el, row, col) {
  if (!el) return new Error("No element provided.");
  el.style.gridRow = row;
  el.style.gridColumn = col;
  board.appendChild(el);
}

/**
 * @param {DirectionKey} key
 */
function directionFromInput(key) {
  // return key.replace("Arrow", "").toLocaleLowerCase()
  const directionMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };
  return directionMap[key];
}

/**
 * @typedef {"ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"} DirectionKey
 */

/**
 * @param {DirectionKey} key
 * @returns {boolean}
 */
function isDirectionInput(key) {
  return directionFromInput(key) != undefined;
}

function isSpacebar(key) {
  return key == " ";
}

/**
 * @param {Direction} direction
 */
function setCurDirection(direction) {
  STATE.curDirection = direction;
}

/**
 * @param {Direction} direction
 */
function setNewDirection(direction) {
  STATE.newDirection = direction;
}

/**
 * @param {Direction} direction
 */
function isOppositeCurDirection(direction) {
  const opposite = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };
  return direction == opposite[STATE.curDirection];
}

function makeFood() {
  return makeDivWithClassName("food");
}

function setFoodPosition() {
  let position;
  do {
    position = getRandomBoardRowCol();
  } while (isOccupied(position));

  STATE.foodPosition = position;
}

function addFoodToBoard() {
  const food = makeFood();
  setFoodPosition();
  const { row, col } = STATE.foodPosition;
  placeOnBoard(food, row, col);
}

/**
 * @param {('head' | 'body')} segment
 * @returns
 */
function makeSnakeSegment(segment = "body") {
  const div = makeDivWithClassName("snake");
  if (segment == "head") {
    div.classList.add("head");
  }
  return div;
}

/**
 * @param {SnakeSegment} segment
 */
function addSnakeSegment(segment) {
  STATE.snake.push(segment);
}

function drawSnake() {
  STATE.snake.forEach((section, i) =>
    placeOnBoard(section.el, section.row, section.col)
  );
}

function initSnake() {
  const snakeHead = makeSnakeSegment("head");
  const { row, col } = getRandomBoardRowCol();
  addSnakeSegment({ el: snakeHead, row, col });
  drawSnake();
}

function updateSnakeHeadPosition() {
  switch (STATE.newDirection) {
    case "up":
      STATE.snake[0].row -= 1;
      break;
    case "down":
      STATE.snake[0].row += 1;
      break;
    case "left":
      STATE.snake[0].col -= 1;
      break;
    case "right":
      STATE.snake[0].col += 1;
      break;
    default:
      break;
  }
  STATE.curDirection = STATE.newDirection;
}

function updateSnakeBodyPosition() {
  for (let i = STATE.snake.length - 1; i > 0; i--) {
    const leadingSegmentRow = STATE.snake[i - 1].row;
    const leadingSegmentCol = STATE.snake[i - 1].col;
    STATE.snake[i].row = leadingSegmentRow;
    STATE.snake[i].col = leadingSegmentCol;
  }
}

function updateSnakePosition() {
  if (!STATE.newDirection) return;

  if (STATE.snake.length > 1) {
    updateSnakeBodyPosition();
  }
  updateSnakeHeadPosition();
}

function endGame() {
  // STATE.isGameOver = true;
  clearInterval(STATE.refreshIntervalId);
  alert("Game Over");
  location.reload();
}

function handleOutOfBounds() {
  if (
    STATE.snake[0].row == 0 ||
    STATE.snake[0].col == 0 ||
    STATE.snake[0].row > SETTINGS.gridSize ||
    STATE.snake[0].col > SETTINGS.gridSize
  ) {
    endGame();
  }
}

function handleSnakeSelfCollision() {
  const { el, row: headRow, col: headCol } = STATE.snake[0];
  if (
    STATE.snake.some(
      (seg, i) => seg.row == headRow && seg.col == headCol && i > 0
    )
  ) {
    endGame();
  }
}

function isSnakeAtFood() {
  const { row: foodRow, col: foodCol } = STATE.foodPosition;
  const { row: snakeRow, col: snakeCol } = STATE.snake[0];
  return foodRow == snakeRow && foodCol == snakeCol;
}

function addFoodToSnake() {
  const food = document.querySelector(".food");
  if (!food) return;
  food.className = "snake";
  addSnakeSegment({
    el: food,
    row: STATE.foodPosition.row,
    col: STATE.foodPosition.col,
  });
}

function eatFood() {
  addFoodToSnake();
  addFoodToBoard();
  STATE.score += 1;
}

function tryEatFood() {
  if (isSnakeAtFood()) {
    eatFood();
  }
}

function togglePause() {
  STATE.isGameRunning = !STATE.isGameRunning;
}

function gameLoop() {
  if (!STATE.isGameRunning) return;
  tryEatFood();
  updateSnakePosition();
  handleOutOfBounds();
  handleSnakeSelfCollision();
  drawSnake();
}

function startGameplay() {
  if (!STATE.newDirection) return;
  STATE.isGameStarted = true;
  STATE.isGameRunning = true;
  return setInterval(gameLoop, SETTINGS.refreshInterval);
}

/**
 * @param {KeyboardEvent | PointerEvent} e
 */
function handleInput(e) {
  let input;
  if (Object.hasOwn("key")) {
    input = e.key;
  } else {
    input = e.target.dataset.key;
  }
  if (!input) return;

  console.log(input);
  if (isSpacebar(input)) {
    togglePause();
    return;
  }
  if (!isDirectionInput(input)) return;

  const newDirection = directionFromInput(input);

  if (isOppositeCurDirection(newDirection)) return;

  setNewDirection(newDirection);
  if (!STATE.isGameStarted) {
    STATE.refreshIntervalId = startGameplay();
  }
}

function getPrevHighScore() {
  STATE.highScore = +localStorage.getItem("highScore") || 0;
}

function registerListeners() {
  document.addEventListener("keydown", handleInput);
  document
    .querySelectorAll(".d-btn")
    .forEach((btn) => btn.addEventListener("click", handleInput));
}

function initBoard() {
  getPrevHighScore();
  initSnake();
  addFoodToBoard();
  registerListeners();
}

initBoard();
