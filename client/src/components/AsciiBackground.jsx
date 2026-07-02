import React, { useEffect, useRef } from 'react';

const AsciiBackground = () => {
  const preRef = useRef(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    // Load the TV Grid image
    const img = new Image();
    img.src = '/tv_grid.jpg';

    // Offscreen canvas for frame pixel processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let time = 0;
    let animationFrameId;
    const chars = " .:-=+*#%@";

    // Monospace font character dimensions for calculations
    const charWidth = 6;
    const charHeight = 11;

    let cols = 100;
    let rows = 50;

    // Aspect-ratio cover formula: crops the image to fill the screen canvas exactly
    const drawImageCover = (w, h) => {
      const imgRatio = img.width / img.height;
      const canvasRatio = w / h;
      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

      if (imgRatio > canvasRatio) {
        // Image is wider: crop horizontal sides
        sWidth = img.height * canvasRatio;
        sx = (img.width - sWidth) / 2;
      } else {
        // Image is taller: crop vertical top/bottom
        sHeight = img.width / canvasRatio;
        sy = (img.height - sHeight) / 2;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, w, h);
    };

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      // Calculate columns and rows required to fill the window viewport exactly
      cols = Math.ceil(w / charWidth);
      rows = Math.ceil(h / charHeight);

      canvas.width = cols;
      canvas.height = rows;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    img.onload = () => {
      const render = () => {
        time += 0.055; // Slightly faster motion for higher visibility

        // Scale and crop the image to cover the canvas grid
        drawImageCover(cols, rows);

        // Get pixel color array
        const imgData = ctx.getImageData(0, 0, cols, rows);
        const data = imgData.data;
        const grid = [];

        // Convert pixels to ASCII characters, applying math waves for motion
        for (let y = 0; y < rows; y++) {
          let line = "";
          for (let x = 0; x < cols; x++) {
            const idx = (y * cols + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Brightness calculation
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // 1. Rolling CRT scanlines (stronger amplitude for higher visibility)
            const scanline = Math.sin(y * 0.28 - time * 6) * 35;
            gray += scanline;

            // 2. Analog television static/noise (stronger flicker)
            const staticNoise = (Math.random() - 0.5) * 30;
            gray += staticNoise;

            // 3. CRT screen global flickers
            const flicker = Math.sin(time * 16) * 8 + Math.cos(time * 8) * 4;
            gray += flicker;

            // Clamp within byte bounds
            gray = Math.max(0, Math.min(255, gray));

            // Map to ASCII character
            const charIdx = Math.floor((gray / 255) * (chars.length - 1));
            line += chars[charIdx];
          }
          grid.push(line);
        }

        // Draw the final ASCII text block
        pre.textContent = grid.join('\n');

        animationFrameId = requestAnimationFrame(render);
      };

      render();
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <pre
      ref={preRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        color: 'rgba(255, 255, 255, 0.14)', // Increased contrast silver-white CRT monitor glow
        backgroundColor: 'transparent',
        fontFamily: 'monospace',
        fontSize: '10px',
        lineHeight: '11px',
        letterSpacing: '0px',
        pointerEvents: 'none',
        zIndex: 0,
        userSelect: 'none',
        display: 'block',
        whiteSpace: 'pre',
        textAlign: 'left'
      }}
    />
  );
};

export default AsciiBackground;
