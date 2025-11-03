import React from "react";
import styled from "styled-components";

// ⚠️ IMPORTANT: Replace these with the actual paths to your SVG files.
// Naming convention: {Color}{PieceType}.svg
import wP from "./assets/wp.svg"; // White Pawn
import wN from "./assets/wn.svg"; // White Knight
import wB from "./assets/wb.svg"; // White Bishop
import wR from "./assets/wr.svg"; // White Rook
import wQ from "./assets/wq.svg"; // White Queen
import wK from "./assets/wk.svg"; // White King

import bP from "./assets/bp.svg"; // Black Pawn
import bN from "./assets/bn.svg"; // Black Knight
import bB from "./assets/bb.svg"; // Black Bishop
import bR from "./assets/br.svg"; // Black Rook
import bQ from "./assets/bq.svg"; // Black Queen
import bK from "./assets/bk.svg"; // Black King

const PieceImage = styled.img`
  /* --- KEY CHANGES FOR ANIMATION --- */
  position: absolute; /* Ensures the piece is layer-correct */
  top: 10%; /* Center the 80% piece image inside the square */
  left: 10%; /* Center the 80% piece image inside the square */

  /* 🚨 This line creates the smooth movement effect! 
       When React moves the piece from one square component to another, 
       the CSS 'transform' smoothly moves the piece over. */
  transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.5, 1);

  /* --- ORIGINAL STYLES --- */
  width: 80%;
  height: 80%;
  user-select: none;
  pointer-events: none;
  z-index: 2;
`;

const pieceMap = {
  // White pieces (Uppercase)
  P: wP,
  N: wN,
  B: wB,
  R: wR,
  Q: wQ,
  K: wK, // Black pieces (Lowercase)
  p: bP,
  n: bN,
  b: bB,
  r: bR,
  q: bQ,
  k: bK,
};

const Piece = ({ type }) => {
  const src = pieceMap[type.toUpperCase() === type ? type : type.toLowerCase()]; // Ensure correct lookup

  if (!src) {
    return null;
  }

  return <PieceImage src={src} alt={`${type} chess piece`} />;
};

export default Piece;
