// =================================================================
// ai-worker.js (Final Performance Version: Alpha-Beta with Time Limit)
// =================================================================

import { Chess } from "chess.js";

console.log("[Worker] Worker script loaded.");

// --- AI HELPER FUNCTIONS (Keep as is) ---
const pieceValues = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 900,
};

const evaluateBoard = (game) => {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? -100000 : 100000;
  }
  if (game.isDraw() || game.isStalemate()) {
    return 0;
  }
  let score = 0;
  game.board().forEach((row) => {
    row.forEach((square) => {
      if (square) {
        const value = pieceValues[square.type];
        score += square.color === "w" ? value : -value;
      }
    });
  });
  return score;
};

// --- ALPHA-BETA PRUNING (Keep as is) ---
const alphaBeta = (game, depth, alpha, beta, isMaximizingPlayer) => {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const possibleMoves = game.moves({ verbose: true });
  if (possibleMoves.length === 0) {
    return evaluateBoard(game);
  }

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of possibleMoves) {
      game.move(move);
      const evaluation = alphaBeta(game, depth - 1, alpha, beta, false);
      game.undo();

      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, maxEval);

      if (beta <= alpha) {
        break;
      }
    }
    return maxEval;
  } else {
    // Minimizing Player
    let minEval = Infinity;
    for (const move of possibleMoves) {
      game.move(move);
      const evaluation = alphaBeta(game, depth - 1, alpha, beta, true);
      game.undo();

      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, minEval);

      if (beta <= alpha) {
        break;
      }
    }
    return minEval;
  }
};
// ----------------------------------------------------------------

// --- Best Move Finder with TIME LIMIT ---
const findBestMoveWorker = (fen, difficultyLevel) => {
  const currentBoard = new Chess(fen);
  const possibleMoves = currentBoard.moves({ verbose: true });
  if (possibleMoves.length === 0) return null;

  // The move we will return
  let bestMove = possibleMoves[0];

  // --- Time Management ---
  // The thinkingTime calculation from ChessBoard.jsx is: maxTime - ((difficulty - 1) / 9) * (maxTime - minTime)
  // Let's replicate this to determine the budget.
  const MAX_TIME = 1500; // ms
  const MIN_TIME = 200; // ms
  const MAX_DEPTH = 5;

  // Calculate the total time budget (in ms)
  const timeBudget =
    MAX_TIME - ((difficultyLevel - 1) / 9) * (MAX_TIME - MIN_TIME);
  const startTime = Date.now();

  // Set the "interrupt" time slightly before the budget runs out (e.g., 90%)
  const interruptTime = startTime + timeBudget * 0.9;

  // --- Iterative Deepening Loop ---
  // The actual search depth is capped at 5 to prevent total collapse.
  const targetDepth = Math.min(Math.ceil(difficultyLevel * 0.5), MAX_DEPTH);

  for (let depth = 1; depth <= targetDepth; depth++) {
    let currentBestMoveForDepth = null;
    let bestEval = currentBoard.turn() === "w" ? -Infinity : Infinity;
    const isMaximizingPlayer = currentBoard.turn() === "w";

    // Check if we already exceeded the time limit before starting the next depth
    if (Date.now() >= interruptTime) {
      console.log(
        `[Worker] Time budget exhausted before starting depth ${depth}.`
      );
      break;
    }

    console.log(`[Worker] Searching Depth ${depth}...`);

    for (const move of possibleMoves) {
      // Stop the search if we are running out of time during the loop
      if (Date.now() >= interruptTime) {
        console.log(`[Worker] Interrupted search at depth ${depth}.`);
        break; // Break the inner loop (move search)
      }

      currentBoard.move(move);

      const evaluation = alphaBeta(
        currentBoard,
        depth - 1, // Use the current loop depth
        -Infinity,
        Infinity,
        !isMaximizingPlayer
      );
      currentBoard.undo();

      // Update best move found for THIS depth
      if (isMaximizingPlayer) {
        if (evaluation > bestEval) {
          bestEval = evaluation;
          currentBestMoveForDepth = move;
        }
      } else {
        if (evaluation < bestEval) {
          bestEval = evaluation;
          currentBestMoveForDepth = move;
        }
      }
    }

    // If the search for this depth completed successfully (wasn't interrupted)
    if (currentBestMoveForDepth) {
      bestMove = currentBestMoveForDepth; // Keep the best move found so far
      console.log(
        `[Worker] Completed Depth ${depth}. Best move so far: ${bestMove.san}`
      );
    } else {
      // If it was interrupted, we stop iterative deepening and use the last known best move.
      break;
    }
  }

  console.log(
    `[Worker] Final move: ${bestMove.san}. Time taken: ${
      Date.now() - startTime
    }ms`
  );
  return bestMove;
};

// --- WORKER EVENT LISTENER (Keep as is) ---
self.onmessage = (event) => {
  try {
    const { fen, difficulty } = event.data;
    console.log(`[Worker] Received FEN: ${fen} (Difficulty: ${difficulty})`);

    const bestMove = findBestMoveWorker(fen, difficulty);

    console.log("[Worker] Calculation complete. Sending move:", bestMove);
    self.postMessage({ bestMove });
  } catch (error) {
    // If anything fails, send an error message back to the main thread
    console.error("[Worker] Error during calculation:", error);
    self.postMessage({ error: error.message });
  }
};
