import React, { useState, useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import ChessBoard from "./ChessBoard";
import backgroundArt from "./image.png"; // Ensure this path is correct

// --- 1. GLOBAL STYLES ---
const GlobalStyle = createGlobalStyle`
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');

html, body {
margin: 0;
padding: 0;
overflow-x: hidden; 
background-color: #0d0e14; 
}

* {
box-sizing: border-box;
}
`;

// --- 2. MAIN CONTAINER STYLES ---
const IntroContainer = styled.div`
  position: relative;
  width: 100vw;
  max-width: 100%;
  height: 100vh;

  background-color: #0d0e14;
  background-image: url(${backgroundArt});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;

  display: flex;
  flex-direction: column;
  justify-content: ${(props) =>
    props.$gamePhase === 3 ? "flex-start" : "flex-end"};

  align-items: center;
  text-align: center;

  padding-bottom: 50px;
  padding-top: ${(props) => (props.$gamePhase === 3 ? "0" : "50px")};
`;

// --- 3. TITLE STYLES ---
const Title = styled.h1`
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  font-family: "Cinzel", serif;
  font-size: 5em;
  color: #ffcc00;
  text-shadow: 0 0 10px rgba(255, 204, 0, 0.7);
  margin: 0;
  user-select: none;
  z-index: 10;
`;

// --- 4. BACK BUTTON STYLES ---
const BackButton = styled.button`
  position: absolute;
  top: 30px;
  left: 30px;
  background: none;
  border: none;
  color: #ffcc00;
  font-size: 3em;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: transform 0.2s ease-in-out;
  z-index: 20;

  &:hover {
    transform: translateX(-5px);
  }

  &::before {
    content: "←";
  }
`;

// --- 5. CONFIG BOX & SLIDER STYLES ---
const GameConfigBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;

  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 5px;
  border: 4px solid #ffcc00;
  box-shadow: 0 0 20px rgba(255, 204, 0, 0.5);
  padding: 15px 25px;
  width: auto;
  max-width: 50%;
`;

const DifficultyControl = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
`;

const DifficultyLabel = styled.span`
  font-family: "Cinzel", serif;
  font-size: 1em;
  color: #ffcc00;
  text-shadow: 0 0 5px rgba(255, 204, 0, 0.7);
`;

const DifficultySlider = styled.input`
  width: 250px;
  height: 8px;
  -webkit-appearance: none;
  background: #ffcc00;
  border-radius: 5px;
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #000;
    border: 3px solid #ffcc00;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 5px rgba(255, 204, 0, 1);
  }
`;

// --- 6. BUTTON LAYOUT CONTAINERS ---
const BottomButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 80px;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  opacity: 1;
  transition: opacity 0.5s ease-in-out;
`;

// --- 7. INDIVIDUAL BUTTON STYLES ---
const BaseButton = styled.button`
  background-color: #000000;
  color: #ffcc00;
  font-family: "Cinzel", serif;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
`;

const PrimaryButton = styled(BaseButton)`
  font-size: 1.5em;
  letter-spacing: 3px;
  padding: 15px 50px;
  box-shadow: 0 0 15px rgba(255, 204, 0, 1), 0 0 30px rgba(255, 204, 0, 0.6),
    0 0 0 4px #ffcc00;

  &:hover {
    background-color: #1a1a1a;
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(255, 204, 0, 1), 0 0 40px rgba(255, 204, 0, 0.8),
      0 0 0 4px #ffcc00;
  }
`;

const SecondaryButton = styled(BaseButton)`
  font-size: 1.5em;
  letter-spacing: 2px;
  padding: 5px 5px;
  width: 140px;
  text-align: center;
  display: inline-block;

  box-shadow: 0 0 10px rgba(255, 204, 0, 0.8), 0 0 20px rgba(255, 204, 0, 0.4),
    0 0 0 3px #ffcc00;

  &:hover {
    background-color: #1a1a1a;
    box-shadow: 0 0 15px rgba(255, 204, 0, 1), 0 0 25px rgba(255, 204, 0, 0.6),
      0 0 0 3px #ffcc00;
  }
`;

// --- NEW STYLED COMPONENT for Board Positioning ---
const BoardWrapperWithMargin = styled.div`
  /* Apply a top margin to push the board down */
  margin-top: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

// --- 8. THE MAIN REACT COMPONENT ---
function App() {
  // 0: Start Screen, 1: Mode Select, 2: Config (Difficulty/Color), 3: Game In Progress
  const [gamePhase, setGamePhase] = useState(0);
  const [gameMode, setGameMode] = useState(null);
  const [difficulty, setDifficulty] = useState(2);
  const [playerColor, setPlayerColor] = useState(null);

  // 🚨 FIX 1: This function now sets the phase to 1 (Mode Select) and resets game parameters.
  const handleStartNewGame = () => {
    setGamePhase(1);
    setGameMode(null);
    setPlayerColor(null);
  };

  useEffect(() => {
    const disableCtrlScrollZoom = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };

    window.addEventListener("wheel", disableCtrlScrollZoom, { passive: false });
    return () => {
      window.removeEventListener("wheel", disableCtrlScrollZoom);
    };
  }, []);

  const handleBack = () => {
    // When leaving an active game (Phase 3), the Back button goes to Phase 2 (Config)
    if (gamePhase === 3) {
      setGamePhase(2);
    } else if (gamePhase === 2) {
      setGamePhase(1);
    } else if (gamePhase === 1) {
      setGamePhase(0);
      setGameMode(null);
      setPlayerColor(null);
    }
  };

  const handleModeSelect = (mode) => {
    setGameMode(mode);
    setPlayerColor(null);
    // P v P starts immediately (Phase 3), P v AI goes to config (Phase 2)
    setGamePhase(mode === "P_AI" ? 2 : 3);
  };

  const handleColorSelect = (color) => {
    setPlayerColor(color);
    setGameMode("P_AI");
    console.log(`Starting P v AI game (Difficulty: ${difficulty}) as ${color}`);
    setGamePhase(3); // Start game
  };

  const renderDifficultyAndColor = () => (
    <GameConfigBox>
      <DifficultyControl>
        <DifficultyLabel>AI DIFFICULTY: {difficulty} / 10</DifficultyLabel>
        <DifficultySlider
          type="range"
          min="1"
          max="10"
          value={difficulty}
          onChange={(e) => setDifficulty(parseInt(e.target.value))}
        />
      </DifficultyControl>
      {/* Buttons for Player Color Selection */}
      <ButtonRow>
        <SecondaryButton onClick={() => handleColorSelect("White")}>
          Play as White
        </SecondaryButton>
        <SecondaryButton onClick={() => handleColorSelect("Black")}>
          Play as Black
        </SecondaryButton>
      </ButtonRow>
    </GameConfigBox>
  );

  const renderBottomContent = () => {
    switch (gamePhase) {
      case 0:
        return (
          <PrimaryButton onClick={() => setGamePhase(1)}>
            START GAME
          </PrimaryButton>
        );
      case 1:
        return (
          <ButtonRow>
            <SecondaryButton onClick={() => handleModeSelect("P_AI")}>
              P v AI
            </SecondaryButton>
            <SecondaryButton onClick={() => handleModeSelect("P_P")}>
              P v P
            </SecondaryButton>
          </ButtonRow>
        );
      case 2:
        return renderDifficultyAndColor();
      case 3:
        return null;
      default:
        return null;
    }
  };

  const renderMainContent = () => {
    if (gamePhase === 3) {
      return (
        <BoardWrapperWithMargin>
          <ChessBoard
            gameMode={gameMode}
            difficulty={difficulty}
            playerColor={playerColor}
            onNewGameRequest={handleStartNewGame} // Passed modified function
          />
        </BoardWrapperWithMargin>
      );
    }

    // Phases 0, 1, 2 show content in the bottom area
    return <BottomButtonWrapper>{renderBottomContent()}</BottomButtonWrapper>;
  };

  return (
    <>
      <GlobalStyle />
      <IntroContainer $gamePhase={gamePhase}>
        {gamePhase > 0 && <BackButton onClick={handleBack} />}
        {renderMainContent()}
      </IntroContainer>
    </>
  );
}

export default App;
