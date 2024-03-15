const SETTINGS = {
  gridSize: 40,
  refreshInterval: 100 /* ms */,
};

/**
 * @typedef {Object} Position
 * @property {number|undefined} row - The row position.
 * @property {number|undefined} col - The column position.
 */

/**
 * @typedef {'Up' | 'Down' | 'Left' | 'Right'} Direction
 */

/**
 * @typedef {Object} SnakeSection
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
 *   direction: Direction|undefined,
 *   snake: SnakeSection[],
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
  direction: undefined,
  snake: [],
  refreshIntervalId: undefined,
	_score: 0,
	get score(){
		return this._score
	},
	set score(newScore) {
		this._score = newScore;
		document.querySelector('#currentScore').textContent = newScore
		if (newScore > this.highScore) {
			this.highScore = newScore
		}
	},
	_highScore: 0,
	get highScore(){
		return this._highScore
	},
	set highScore(newHighScore) {
		this._highScore = newHighScore
		document.querySelector('#highScore').textContent = newHighScore
		localStorage.setItem('highScore', newHighScore)
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
 *
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
 *
 * @param {DirectionKey} key
 */
function directionFromKey(key) {
  const directionMap = {
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
  };
  return directionMap[key];
}

/**
 * @typedef {"ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"} DirectionKey
 */

/**
 *
 * @param {DirectionKey} key
 * @returns {boolean}
 */
function isDirectionKey(key) {
  return directionFromKey(key) != undefined;
}

/**
 *
 * @param {Direction} direction
 */
function setDirection(direction) {
  STATE.direction = direction;
}

/**
 *
 * @param {Direction} direction
 */
function isOppositeDirection(direction) {
  const opposite = {
    Up: "Down",
    Down: "Up",
    Left: "Right",
    Right: "Left",
  };
  return direction == opposite[STATE.direction];
}

function isSpacebar(key) {
  return key == ' ';
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
 * 
 * @param {('head' | 'body')} segment 
 * @returns 
 */
function makeSnakeSegment(segment = 'body') {
	const div = makeDivWithClassName('snake');
	if (segment == 'head') {
		div.classList.add('head')
	}
	return div
}

function handleSnakeCollision({row, col}) {
	if (STATE.snake.some(section => section.row == row && section.col == col)) {
		endGame()
	}
}

function drawSnake() {
  STATE.snake.forEach((section, i) => {
    placeOnBoard(section.el, section.row, section.col);
		if (i = 0) handleSnakeCollision({row, col})
  });
}

function initSnake() {
  const snakeHead = makeSnakeSegment('head');
  const { row, col } = getRandomBoardRowCol();
  STATE.snake.push({ el: snakeHead, row, col });
  drawSnake();
}

function updateSnakeHeadPosition() {
  switch (STATE.direction) {
    case "Up":
      STATE.snake[0].row -= 1;
      break;
    case "Down":
      STATE.snake[0].row += 1;
      break;
    case "Left":
      STATE.snake[0].col -= 1;
      break;
    case "Right":
      STATE.snake[0].col += 1;
      break;
    default:
      break;
  }
}

function updateSnakeBodyPosition() {
  for (let i = STATE.snake.length - 1; i > 0; i--) {
    const leadingSectionRow = STATE.snake[i - 1].row;
    const leadingSectionCol = STATE.snake[i - 1].col;
    STATE.snake[i].row = leadingSectionRow;
    STATE.snake[i].col = leadingSectionCol;
  }
}

function updateSnakePosition() {
  if (!STATE.direction) return;
  if (STATE.snake.length > 1) {
    updateSnakeBodyPosition();
  }
  updateSnakeHeadPosition();
}

function endGame() {
  STATE.isGameOver = true;
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

function addFoodToSnake() {
  const food = document.querySelector(".food");
  if (!food) return;
  food.className = "snake";
  STATE.snake.push({
    el: food,
    row: STATE.foodPosition.row,
    col: STATE.foodPosition.col,
  });
}

function isSnakeAtFood() {
  const { row: foodRow, col: foodCol } = STATE.foodPosition;
  const { row: snakeRow, col: snakeCol } = STATE.snake[0];
  return foodRow == snakeRow && foodCol == snakeCol;
}

function eatFood() {
  addFoodToSnake();
  addFoodToBoard();
	STATE.score += 1
}

function gameLoop() {
	if (!STATE.isGameRunning) return;
	updateSnakePosition();
	handleOutOfBounds();
	drawSnake();
	if (isSnakeAtFood()) {
		eatFood();
	}
}

function startGameplay() {
  if (!STATE.direction) return;
  STATE.isGameRunning = true;
  STATE.isGameStarted = true;

  return setInterval(gameLoop, SETTINGS.refreshInterval);
}

/**
 *
 * @param {KeyboardEvent} e
 */
function handleInput(e) {
  const { key } = e;
  console.log(key);
  if (isSpacebar(key)) {
    togglePause();
    return;
  }
  if (!isDirectionKey(key)) return;
  const direction = directionFromKey(key);

  if (isOppositeDirection(direction)) return;

  setDirection(direction);
  if (!STATE.isGameStarted) {
    STATE.refreshIntervalId = startGameplay();
  }
}

function getPrevHighScore() {
	STATE.highScore = +localStorage.getItem('highScore') || 0
}

function initBoard() {
  initSnake();
  drawSnake();
  addFoodToBoard();
	getPrevHighScore()
  document.addEventListener("keydown", handleInput);
}

function pauseGame() {
  STATE.isGameRunning = false;
}
function unpauseGame() {
  STATE.isGameRunning = true;
}

function togglePause() {
  STATE.isGameRunning = !STATE.isGameRunning;
}

initBoard();
