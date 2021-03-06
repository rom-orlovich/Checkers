import {
  BLACK,
  QUEEN,
  SIMPLE_PAWN,
  SIZE_BOARD,
  WHITE,
} from "./helpers/ConstantVariables.js";
import { checkTheElIsUniqueInArray } from "./helpers/utilitesFun.js";

/**
 * @class Class with all the data about piece
 */
export class Piece {
  constructor(row, col, color, type) {
    this.row = row;
    this.col = col;
    this.color = color;
    this.type = type;
    this.flipMode = false;
    this.relativeMoves = [];
    this.possibleMoves = [];
    this.opponentPos = [];
    this.eatMoves = [];

    this.dir = this.color === WHITE ? 1 : -1;
    this.elPawn = document.createElement("div");
    this.elPawn.classList.add("center-abs", "pawn", `pawn-${color}`);
    this.cachedMoved = [];
  }
  //Get possible moves after filter of illegal moves
  getPossibleMove(boardData) {
    this.filterRegularMoves(boardData);

    return this.possibleMoves;
  }
  //Filter the possible moves
  //And check if there are any oppoent nearby
  filterRegularMoves(boardData) {
    this.getRelativeMoves(boardData);

    this.opponentPos = [];

    this.possibleMoves = this.relativeMoves.filter((move) => {
      const [row, col] = move;
      const piece = boardData.getPlayer(row, col);
      const opponent = boardData.getOpponent(row, col, this.color);

      //Check if the opponent pos is in the opponentPos array and if he isn't there
      //add his pos to this opponentPos array
      if (opponent && checkTheElIsUniqueInArray(move, this.opponentPos))
        this.opponentPos.push(move);

      if (this.checkBorders(row, col) && !piece) return move;
    });
  }
  //Get relative moves by the type of the piece
  getRelativeMoves(boardData) {
    this.relativeMoves =
      this.type === SIMPLE_PAWN
        ? this.pawnMove()
        : [
            ...this.queenMove(-1, 1, boardData),
            ...this.queenMove(1, -1, boardData),
            ...this.queenMove(1, 1, boardData),
            ...this.queenMove(-1, -1, boardData),
          ];
  }

  pawnMove() {
    let newRow;
    newRow = this.row + this.dir;
    return this.flipMode
      ? [
          [newRow, this.col + 1],
          [newRow, this.col - 1],
          [newRow - this.dir * 2, this.col - 1],
          [newRow - this.dir * 2, this.col + 1],
        ]
      : [
          [newRow, this.col + 1],
          [newRow, this.col - 1],
        ];
  }

  //Get queen moves by all oblique diractions
  queenMove(directionRow, directionCol, boardData) {
    let result = [];
    for (let i = 1; i < SIZE_BOARD; i++) {
      let row = this.row + directionRow * i;
      let col = this.col + directionCol * i;
      const pieceSameColor = boardData.getPlayer(row, col);
      const opponent = boardData.getOpponent(row, col);
      if (pieceSameColor && pieceSameColor.color === this.color) {
        result.push([row, col]);
        return result;
      }
      if (opponent) {
        result.push([row, col]);
        return result;
      }
      if (this.checkBorders(row, col)) result.push([row, col]);
    }
    return result;
  }
  getEatMoves(boardData) {
    this.eatMoves = [];
    this.eatMove(boardData);

    return this.eatMoves;
  }
  //search eatMove by recursion search
  eatMove(boardData) {
    //If there is no opponent exit from the function
    if (this.opponentPos.length === 0) return;

    const recursionSearch = (firstMove, nextMove, boardData) => {
      //Check the first square of search
      //Check if the next square is potential place to jump after eating
      const checkNextMove = this.checkPotentialEatMove(
        firstMove,
        nextMove,
        boardData
      );

      //If is not exist exit from the function

      if (!checkNextMove) return false;

      const { newMove, dirRow } = checkNextMove;

      //Each check of the recursion search , if there is potential square
      //Add this pos to the eatMoves array
      checkTheElIsUniqueInArray(newMove, this.eatMoves) &&
        this.eatMoves.push(newMove);

      //Get the next pos to check:left square, right square and backward right square
      const nextMoveLeftPos = [newMove[0] + dirRow, newMove[1] - 1];
      const nextMoveRightPos = [newMove[0] + dirRow, newMove[1] + 1];
      const backMoveRightPos = [newMove[0] + dirRow * -1, newMove[1] + 1];
      const backMoveLeftPos = [newMove[0] + dirRow * -1, newMove[1] - 1];

      //If there is no potenial square exit from the function
      if (
        !recursionSearch(newMove, nextMoveLeftPos, boardData) &&
        !recursionSearch(newMove, nextMoveRightPos, boardData) &&
        !recursionSearch(newMove, backMoveRightPos, boardData) &&
        !recursionSearch(newMove, backMoveLeftPos, boardData)
      )
        return;
    };

    //Loop over the opponent pos
    this.opponentPos.forEach((opPos) => {
      recursionSearch([this.row, this.col], opPos, boardData);
    });
    this.cachedMoved = [];
  }

  checkPotentialEatMove(curPos, nextPos, boardData) {
    const [curRow, curCol] = curPos;
    const [nextRow, nextCol] = nextPos;

    //For stack memory exceed- Important otherwise the recursion will be infinte!!!
    if (
      this.cachedMoved.some(
        (el) => el.toString() === [curPos, nextPos].toString()
      )
    )
      return;

    this.cachedMoved.push([curPos, nextPos]);

    //Check diff between the next and pre rows and cols
    const difRow = nextRow - curRow;
    const difCol = nextCol - curCol;

    //If the diff are bigger than zero row and col are up by 1 otherwise by -1
    const dirRow = difRow > 0 ? 1 : -1;
    const dirCol = difCol > 0 ? 1 : -1;

    //Normalize the potential place of the empty sqaure
    const newRow = nextRow + dirRow;
    const newCol = nextCol + dirCol;

    //Check if there is opponent nearby, the pos is legal and the nextPos is occupied
    //Otherwise exit from the function

    const checkBoarder = this.checkBorders(newRow, newCol);
    if (!checkBoarder) return;

    const isOccupied = boardData.getPlayer(newRow, newCol);
    if (isOccupied) return;

    const isOpponent = boardData.getOpponent(nextRow, nextCol, this.color);
    if (!isOpponent) return;

    const opponentPos = [isOpponent.row, isOpponent.col];

    //If there isn't the same pos of opponent add the opponent pos to opponentPos array
    checkTheElIsUniqueInArray(opponentPos, this.opponentPos) &&
      this.opponentPos.push(opponentPos);

    return { newMove: [newRow, newCol], dirRow, dirCol };
  }

  /**
   * 
   * @param {Number} nextRow 
   * @param {Number} nextCol 
   * @param {Array} curMove Array of the cur pos :[row,col]
   * @returns Return the potential pos of opponent.
   *  Check if the row and col of the empty sqaure that are given,
    are after opponent pos, and return the opponent pos.
   */

  checkOpponentPos(nextRow, nextCol, curMove = [this.row, this.col]) {
    const [curRow, curCol] = curMove;

    //Check potential the diff between next and pre rows and col
    const difRow = nextRow - curRow;
    const difCol = nextCol - curCol;

    //Return the potential pos of opponent
    if (difRow <= -2 && difCol > 0) return [nextRow + 1, nextCol - 1];
    else if (difRow <= -2 && difCol < 0) return [nextRow + 1, nextCol + 1];
    else if (difRow >= 2 && difCol < 0) return [nextRow - 1, nextCol + 1];
    else if (difRow >= 2 && difCol > 0) return [nextRow - 1, nextCol - 1];
    else return [];
  }

  checkBorders(row, col) {
    return row >= 0 && row < SIZE_BOARD && col >= 0 && col < SIZE_BOARD;
  }
  resetPieceState() {
    this.relativeMoves = [];
    this.possibleMoves = [];
    this.opponentPos = [];
    this.eatMoves = [];
  }
  setQueen() {
    this.elPawn.classList.add(`${QUEEN}-${this.color}`);
    this.type = QUEEN;
    this.resetPieceState();
  }

  //Set the ablity to move backward during flip jump
  checkFilpMode() {
    if (this.type === SIMPLE_PAWN) {
      if (this.eatMoves.length >= 2) this.flipMode = true;
      if (this.eatMoves.length === 0) this.flipMode = false;
    }
  }
}
