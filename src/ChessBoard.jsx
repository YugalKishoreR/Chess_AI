import React, { useState, useMemo, useCallback, useEffect } from "react";
import styled from "styled-components";
import { Chess } from "chess.js";
import Piece from "./Piece";
import ScaleController from "./ScaleController";

// IMPORTANT: Ensure your worker file is named 'ai-worker.js'
// and is in the same directory as ChessBoard.jsx.
import AiWorker from "./ai-worker.js?worker";

// --- CONFIGURATION ---
const BOARD_SIZE = "300px";
const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// --- STYLED COMPONENTS (StatusText styled component removed entirely) ---
const BoardWrapper = styled.div`
  position: relative;
  width: ${BOARD_SIZE};
  height: ${BOARD_SIZE};
  margin: 0 auto;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  cursor: default;
  border: 4px solid #333;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
`;

const BoardContainer = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
`;

const Square = styled.div.attrs((props) => ({
  "data-square-color": props.$isLight ? "light" : "dark",
  "data-algebraic": props.$algebraic,
}))`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.15s ease-out;

  /* Last Move Highlight */
  background-color: ${(props) => {
    if (props.$isLastMove) return "#9a9a40";
    return props.$isLight ? "#F0D9B5" : "#B58863";
  }};

  ${(props) =>
    props.$isSelected &&
    `
 border: 4px solid #f29a02; 
 box-shadow: inset 0 0 10px rgba(255, 255, 0, 0.8);
`}

  ${(props) =>
    props.$isMoveTarget &&
    props.$hasPiece &&
    `
 box-shadow: inset 0 0 0 4px #e00000; 
 cursor: pointer;
`}
`;

const CoordinateLabel = styled.span`
  position: absolute;
  font-family: Arial, sans-serif;
  font-size: 0.1em;
  font-weight: bold;
  z-index: 10;
  padding: 0 2px;
  user-select: none;
  pointer-events: none;

  color: ${(props) => (props.$isLight ? "#B58863" : "#F0D9B5")};

  /* Position Ranks (Numbers) - Top Left */
  ${(props) =>
    props.$isRank &&
    `
 top: 0.1px;
 left: 0.1px;
 right: auto;
 bottom: auto;
`}

  /* Position Files (Letters) - Bottom Right */
${(props) =>
    props.$isFile &&
    `
 bottom: 0.1px;
 right: 0.1px;
 top: auto;
 left: auto;
`}
`;

const MoveIndicator = styled.div`
  width: 30%;
  height: 30%;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  z-index: 5;
`;

const ResultOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
  color: #ffcc00;
  font-family: "Cinzel", serif;
  text-shadow: 0 0 15px rgba(255, 204, 0, 1);
  animation: fadeIn 1s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ResultText = styled.h2`
  font-size: 1em;
  margin-bottom: 20px;
  border-bottom: 3px solid #ffcc00;
  padding-bottom: 10px;
`;

const NewGameButton = styled.button`
  background-color: #000;
  color: #ffcc00;
  font-family: "Cinzel", serif;
  font-weight: bold;
  font-size: 1em;
  padding: 15px 30px;
  border: 3px solid #ffcc00;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(255, 204, 0, 0.8);
  transition: all 0.2s ease;

  &:hover {
    color: black;
    background-color: #ffcc00;
    border: 3px solid black;
  }
`;

// --- FEN PARSER UTILITY (Keep as is) ---
const parseFen = (fen) => {
  const boardState = [];
  const piecePlacement = fen.split(" ")[0];
  for (const char of piecePlacement) {
    if (char === "/") continue;
    else if (/[1-8]/.test(char)) {
      const emptySquares = parseInt(char);
      for (let i = 0; i < emptySquares; i++) {
        boardState.push(null);
      }
    } else {
      boardState.push(char);
    }
  }
  return boardState;
};

// --- CHESS BOARD COMPONENT ---

const ChessBoard = ({
  playerColor,
  gameMode,
  difficulty,
  onNewGameRequest,
}) => {
  const [game, setGame] = useState(() => new Chess(STARTING_FEN));
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);

  const boardPieces = useMemo(() => parseFen(game.fen()), [game]);

  const aiColor = playerColor === "White" ? "b" : "w";
  const playerSide = playerColor === "White" ? "w" : "b"; // --- AUTOMATIC AI MOVE TRIGGER EFFECT ---

  useEffect(() => {
    // Check if it's the AI's turn to move and the game is not over
    if (gameMode === "P_AI" && game.turn() === aiColor && !game.isGameOver()) {
      // Create and terminate worker for each move
      const worker = new AiWorker();
      setIsThinking(true); // --- WORKER RESPONSE HANDLER (Defined inside effect scope) ---

      const handleWorkerResponse = (event) => {
        setIsThinking(false);

        if (event.data.error) {
          console.error("[Main] Worker Error:", event.data.error);
          return;
        }

        const { bestMove } = event.data;
        console.log("[Main] Received move from worker:", bestMove);

        if (bestMove) {
          try {
            setGame((prevGame) => {
              const newGame = new Chess(prevGame.fen());
              const result = newGame.move(bestMove);
              setLastMove({ from: result.from, to: result.to });
              return newGame;
            });
          } catch (e) {
            console.error(
              "AI attempted illegal move or state update failed:",
              e
            );
          }
        }

        worker.terminate();
      }; // --- WORKER ERROR HANDLER ---

      const handleWorkerError = (error) => {
        console.error("[Main] A fatal worker error occurred:", error.message);
        setIsThinking(false);
        worker.terminate();
      }; // Attach handlers

      worker.onmessage = handleWorkerResponse;
      worker.onerror = handleWorkerError; // Calculate thinking time and post message

      const maxTime = 1500;
      const minTime = 200;
      const thinkingTime =
        maxTime - ((difficulty - 1) / 9) * (maxTime - minTime);

      const timer = setTimeout(() => {
        console.log(`[Main] Sending FEN to worker (Difficulty: ${difficulty})`);
        worker.postMessage({
          fen: game.fen(),
          difficulty: difficulty,
        });
      }, thinkingTime); // --- CLEANUP ---

      return () => {
        clearTimeout(timer);
        worker.terminate();
      };
    }

    return () => {};
  }, [game, gameMode, aiColor, difficulty]); // --- GAME STATUS AND RESULT LOGIC (Only for the checkmate/draw overlay) ---

  const gameStatus = useMemo(() => {
    if (game.isCheckmate()) {
      return `CHECKMATE! ${game.turn() === "w" ? "Black" : "White"} Wins!`;
    } else if (game.isDraw()) {
      if (game.isStalemate()) return "Draw by Stalemate!";
      if (game.isThreefoldRepetition()) return "Draw by Threefold Repetition!";
      if (game.isInsufficientMaterial())
        return "Draw by Insufficient Material!";
      return "Draw!";
    } else {
      return "";
    }
  }, [game]);

  const handleResetGame = () => {
    // Correct logic: Delegate all state resets and view changes to the parent!
    if (onNewGameRequest) {
      onNewGameRequest();
    }
  }; // --- EVENT TRAPPING HANDLERS (Correctly defined with useCallback) ---

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, []);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
  }, []); // --- INTERACTION LOGIC (Keep as is) ---

  const selectPiece = (square) => {
    const moves = game.moves({ square, verbose: true }).map((move) => move.to);
    setSelectedSquare(square);
    setLegalMoves(moves);
  };

  const handleSquareClick = (algebraic) => {
    if (isThinking || game.isGameOver()) {
      return;
    }

    if (gameMode === "P_AI" && game.turn() === aiColor) {
      return;
    }

    const piece = game.get(algebraic);

    if (selectedSquare) {
      if (legalMoves.includes(algebraic)) {
        try {
          const newGame = new Chess(game.fen());
          newGame.move({ from: selectedSquare, to: algebraic, promotion: "q" });

          setGame(newGame);
          setLastMove({ from: selectedSquare, to: algebraic });
          setSelectedSquare(null);
          setLegalMoves([]);
        } catch (e) {
          console.error("Illegal move attempt:", e);
        }
      } else if (algebraic === selectedSquare) {
        setSelectedSquare(null);
        setLegalMoves([]);
      } else {
        if (piece && piece.color === game.turn()) {
          if (gameMode === "P_AI" && piece.color !== playerSide) {
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
          }
          selectPiece(algebraic);
        } else {
          setSelectedSquare(null);
          setLegalMoves([]);
        }
      }
    } else {
      if (piece && piece.color === game.turn()) {
        if (gameMode === "P_AI" && piece.color !== playerSide) {
          return;
        }
        selectPiece(algebraic);
      }
    }
  }; // --- RENDER LOGIC (Keep as is) ---

  const squares = [];
  const isWhiteOrientation = !playerColor || playerColor === "White";
  const rowStart = isWhiteOrientation ? 0 : 7;
  const rowEnd = isWhiteOrientation ? 8 : -1;
  const rowStep = isWhiteOrientation ? 1 : -1;

  for (let row = rowStart; row !== rowEnd; row += rowStep) {
    for (let col = 0; col < 8; col++) {
      const fenIndex = row * 8 + col;
      const pieceType = boardPieces[fenIndex];
      const isLight = (row + col) % 2 === 0;
      const file = String.fromCharCode("a".charCodeAt(0) + col);
      const rank = 8 - row;
      const algebraic = `${file}${rank}`;

      const isSelected = selectedSquare === algebraic;
      const isMoveTarget = legalMoves.includes(algebraic);
      const hasPiece = !!pieceType;

      const isLastMove =
        lastMove && (lastMove.from === algebraic || lastMove.to === algebraic);

      let isRankLabel;
      let isFileLabel;

      if (isWhiteOrientation) {
        isRankLabel = col === 0;
        isFileLabel = row === 7;
      } else {
        isRankLabel = col === 7;
        isFileLabel = row === 0;
      }

      squares.push(
        <Square
          key={algebraic}
          $isLight={isLight}
          $algebraic={algebraic}
          $isSelected={isSelected}
          $isMoveTarget={isMoveTarget}
          $hasPiece={hasPiece}
          $isLastMove={isLastMove}
          onClick={() => handleSquareClick(algebraic)}
        >
          {pieceType && <Piece type={pieceType} />}{" "}
          {isMoveTarget && !hasPiece && <MoveIndicator />}{" "}
          {isRankLabel && (
            <CoordinateLabel $isLight={isLight} $isRank={true}>
              {rank}{" "}
            </CoordinateLabel>
          )}{" "}
          {isFileLabel && (
            <CoordinateLabel $isLight={isLight} $isFile={true}>
              {file.toUpperCase()}{" "}
            </CoordinateLabel>
          )}{" "}
        </Square>
      );
    }
  }

  return (
    <ScaleController>
      {" "}
      <BoardWrapper
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <BoardContainer>{squares}</BoardContainer>{" "}
        {game.isGameOver() && (
          <ResultOverlay>
            <ResultText>{gameStatus.toUpperCase()}</ResultText>{" "}
            <NewGameButton onClick={handleResetGame}>
              START NEW GAME{" "}
            </NewGameButton>{" "}
          </ResultOverlay>
        )}{" "}
      </BoardWrapper>{" "}
    </ScaleController>
  );
};

export default ChessBoard;
