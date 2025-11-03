// ScaleController.jsx (Verification)

import React, { useRef, useLayoutEffect, useState } from "react";
import styled from "styled-components";

// 🚨 CRITICAL: These dimensions must match BOARD_SIZE ('600px') in ChessBoard.jsx
const TARGET_SIZE = "350px";
const TARGET_WIDTH_NUMERIC = 600;

const ScaleWrapper = styled.div`
  width: ${TARGET_SIZE};
  height: ${TARGET_SIZE};

  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  transform-origin: center center;
  transition: transform 0.05s ease-out; /* Smooth snapping back */
`;

const ScaleController = ({ children }) => {
  const parentRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const parentElement = parentRef.current;
    if (!parentElement) return;

    const updateScale = () => {
      const currentWidth = parentElement.offsetWidth;
      const targetWidth = TARGET_WIDTH_NUMERIC;

      // If the element's reported width changes due to page zoom, calculate the inverse scale
      if (currentWidth !== targetWidth && currentWidth > 0) {
        const newScale = targetWidth / currentWidth;

        // Set the scale to visually push it back to the target size
        setScale(newScale);
      } else {
        setScale(1);
      }
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(parentElement);

    // Initial check and cleanup
    updateScale();
    return () => observer.unobserve(parentElement);
  }, []);

  return (
    // The transform style is what visually snaps the zoomed board back
    <ScaleWrapper ref={parentRef} style={{ transform: `scale(${scale})` }}>
      {children}
    </ScaleWrapper>
  );
};

export default ScaleController;
