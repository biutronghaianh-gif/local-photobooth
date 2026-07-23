export interface StickerItem {
  id: string;
  emoji: string;
  x: number; // relative % (0-100) across canvas width
  y: number; // relative % (0-100) across canvas height
  scale: number;
  rotation: number;
}

export interface CollageOptions {
  filter: string;
  frameColor: string;
  frameText: string;
  fontStyle?: string;
  showDate: boolean;
  borderSize: number;
  cornerRadius: number;
  stickers?: StickerItem[];
}

// Draw a rounded rectangle path on the canvas context
export const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Draw a 4-pointed star / sparkle
export const drawSparkle = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) => {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.lineTo(
      cx + Math.cos(angle + Math.PI / 4) * (r / 3),
      cy + Math.sin(angle + Math.PI / 4) * (r / 3)
    );
  }
  ctx.closePath();
  ctx.fill();
};

// Draw image with object-fit: cover center crop
export const drawCoverImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  cornerRadius: number = 0
) => {
  ctx.save();
  
  if (cornerRadius > 0) {
    ctx.beginPath();
    drawRoundedRect(ctx, dx, dy, dw, dh, cornerRadius);
    ctx.clip();
  }
  
  const imgRatio = img.width / img.height;
  const destRatio = dw / dh;
  
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  
  if (imgRatio > destRatio) {
    sw = img.height * destRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / destRatio;
    sy = (img.height - sh) / 2;
  }
  
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
};

// Apply CSS-like filters on Canvas Context
export const applyFilterToContext = (
  ctx: CanvasRenderingContext2D,
  filterType: string
) => {
  ctx.filter = 'none';
  if (filterType === 'grayscale') {
    ctx.filter = 'grayscale(100%) contrast(1.1)';
  } else if (filterType === 'sepia') {
    ctx.filter = 'sepia(80%) contrast(0.95) saturate(1.1)';
  } else if (filterType === 'warm') {
    ctx.filter = 'sepia(25%) saturate(125%) contrast(1.05) brightness(1.02)';
  } else if (filterType === 'cool') {
    ctx.filter = 'saturate(120%) hue-rotate(15deg) brightness(1.03)';
  } else if (filterType === 'contrast') {
    ctx.filter = 'contrast(130%) brightness(0.95)';
  } else if (filterType === 'pink-tint') {
    ctx.filter = 'saturate(110%) contrast(0.95) brightness(1.05)';
  } else if (filterType === 'cyberpunk') {
    ctx.filter = 'saturate(160%) hue-rotate(190deg) contrast(1.2)';
  } else if (filterType === 'retro-sunset') {
    ctx.filter = 'sepia(40%) saturate(150%) hue-rotate(-10deg) brightness(1.05)';
  } else if (filterType === 'dramatic-bw') {
    ctx.filter = 'grayscale(100%) contrast(1.6) brightness(0.9)';
  }
};

// Helper to load multiple images asynchronously
export const loadImages = async (sources: string[]): Promise<HTMLImageElement[]> => {
  return Promise.all(
    sources.map(src => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error('Failed to load image: ' + src));
        img.src = src;
      });
    })
  );
};

// Render the final collage on a canvas and return a base64 Data URL
export const buildCollage = async (
  imageSrcs: string[],
  layoutId: string,
  options: CollageOptions
): Promise<string> => {
  const images = await loadImages(imageSrcs);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  const { frameColor, filter, frameText, showDate, borderSize, cornerRadius } = options;

  // Set default sizes
  let canvasWidth = 500;
  let canvasHeight = 1000;
  let imgWidth = 400;
  let imgHeight = 300;

  // Setup dimensions depending on selected layout
  if (layoutId === 'strip-4') {
    imgWidth = 400;
    imgHeight = 300;
    canvasWidth = imgWidth + borderSize * 2;
    canvasHeight = borderSize * 2 + imgHeight * 4 + borderSize * 3 + 120; // 120px for footer
  } else if (layoutId === 'strip-3') {
    imgWidth = 400;
    imgHeight = 300;
    canvasWidth = imgWidth + borderSize * 2;
    canvasHeight = borderSize * 2 + imgHeight * 3 + borderSize * 2 + 120;
  } else if (layoutId === 'grid-4') {
    imgWidth = 400;
    imgHeight = 300;
    canvasWidth = imgWidth * 2 + borderSize * 3;
    canvasHeight = borderSize * 2 + imgHeight * 2 + borderSize + 130;
  } else if (layoutId === 'single') {
    imgWidth = 460;
    imgHeight = 460; // Square
    canvasWidth = imgWidth + borderSize * 2;
    canvasHeight = borderSize * 2 + imgHeight + 140;
  } else if (layoutId === 'collage') {
    canvasWidth = 800;
    canvasHeight = 600;
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Draw Background (Solid Color or Gradient)
  if (frameColor.startsWith('gradient:')) {
    const gradName = frameColor.replace('gradient:', '');
    const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    if (gradName === 'cotton-candy') {
      grad.addColorStop(0, '#ffd1d1');
      grad.addColorStop(0.5, '#fbcfe8');
      grad.addColorStop(1, '#dbeafe');
    } else if (gradName === 'sunset-glow') {
      grad.addColorStop(0, '#ff9a9e');
      grad.addColorStop(0.5, '#fecfef');
      grad.addColorStop(1, '#a1c4fd');
    } else if (gradName === 'dreamy-lavender') {
      grad.addColorStop(0, '#c2e9fb');
      grad.addColorStop(1, '#e0c3fc');
    } else if (gradName === 'aurora') {
      grad.addColorStop(0, '#84fab0');
      grad.addColorStop(1, '#8fd3f4');
    } else {
      // Fallback pink gradient
      grad.addColorStop(0, '#fda4af');
      grad.addColorStop(1, '#fb7185');
    }
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = frameColor;
  }
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // If layout is collage (Freestyle scrapbooking layout)
  if (layoutId === 'collage') {
    // Draw background sparkles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    drawSparkle(ctx, 400, 300, 15);
    drawSparkle(ctx, 100, 80, 10);
    drawSparkle(ctx, 700, 520, 12);
    drawSparkle(ctx, 720, 100, 8);
    drawSparkle(ctx, 80, 480, 11);

    // Positions & Angles of the 4 photos inside scrapbooking style
    const polaroidPositions = [
      { cx: 220, cy: 175, w: 240, h: 180, angle: -6 },
      { cx: 580, cy: 190, w: 240, h: 180, angle: 5 },
      { cx: 230, cy: 415, w: 240, h: 180, angle: 4 },
      { cx: 570, cy: 410, w: 240, h: 180, angle: -3 }
    ];

    for (let i = 0; i < Math.min(images.length, 4); i++) {
      const pos = polaroidPositions[i];
      ctx.save();
      ctx.translate(pos.cx, pos.cy);
      ctx.rotate((pos.angle * Math.PI) / 180);

      // Add Polaroid white frame & shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 5;

      const pw = pos.w + 16;
      const ph = pos.h + 46;

      ctx.fillStyle = '#ffffff';
      drawRoundedRect(ctx, -pw / 2, -ph / 2, pw, ph, 8);
      ctx.fill();

      // Reset shadow for drawing the photo
      ctx.shadowColor = 'transparent';

      // Draw photo inside white frame
      ctx.save();
      ctx.beginPath();
      drawRoundedRect(ctx, -pos.w / 2, -ph / 2 + 8, pos.w, pos.h, cornerRadius);
      ctx.clip();

      applyFilterToContext(ctx, filter);
      ctx.drawImage(images[i], -pos.w / 2, -ph / 2 + 8, pos.w, pos.h);
      if (filter === 'pink-tint') {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
        ctx.fillRect(-pos.w / 2, -ph / 2 + 8, pos.w, pos.h);
      }
      ctx.restore();

      // Add cute handwriting label
      ctx.fillStyle = '#64748b';
      ctx.font = '12px "Caveat", "Comic Sans MS", cursive, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('sweet moment', 0, ph / 2 - 12);

      ctx.restore();
    }

    // Draw main footer text in the center-bottom of the collage canvas
    const isDarkBackground =
      frameColor === '#18181b' || frameColor.startsWith('gradient:');
    ctx.fillStyle = isDarkBackground ? '#ffffff' : '#be185d';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(frameText || 'SWEET BOOTH', canvasWidth / 2, canvasHeight - 40);

    if (showDate) {
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = isDarkBackground ? 'rgba(255, 255, 255, 0.7)' : 'rgba(190, 24, 93, 0.7)';
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      ctx.fillText(dateStr, canvasWidth / 2, canvasHeight - 15);
    }
  } else {
    // Classic Strips or Grid
    let currentY = borderSize;

    if (layoutId === 'strip-4' || layoutId === 'strip-3') {
      const count = layoutId === 'strip-4' ? 4 : 3;
      for (let i = 0; i < Math.min(images.length, count); i++) {
        const x = borderSize;
        const y = currentY;

        ctx.save();
        applyFilterToContext(ctx, filter);
        drawCoverImage(ctx, images[i], x, y, imgWidth, imgHeight, cornerRadius);
        if (filter === 'pink-tint') {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
          ctx.fillRect(x, y, imgWidth, imgHeight);
        }
        ctx.restore();

        currentY += imgHeight + borderSize;
      }
    } else if (layoutId === 'grid-4') {
      const positions = [
        { x: borderSize, y: borderSize },
        { x: borderSize * 2 + imgWidth, y: borderSize },
        { x: borderSize, y: borderSize * 2 + imgHeight },
        { x: borderSize * 2 + imgWidth, y: borderSize * 2 + imgHeight }
      ];

      for (let i = 0; i < Math.min(images.length, 4); i++) {
        const pos = positions[i];
        ctx.save();
        applyFilterToContext(ctx, filter);
        drawCoverImage(
          ctx,
          images[i],
          pos.x,
          pos.y,
          imgWidth,
          imgHeight,
          cornerRadius
        );
        if (filter === 'pink-tint') {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
          ctx.fillRect(pos.x, pos.y, imgWidth, imgHeight);
        }
        ctx.restore();
      }
      currentY = borderSize * 3 + imgHeight * 2;
    } else if (layoutId === 'single') {
      ctx.save();
      applyFilterToContext(ctx, filter);
      drawCoverImage(
        ctx,
        images[0],
        borderSize,
        borderSize,
        imgWidth,
        imgHeight,
        cornerRadius
      );
      if (filter === 'pink-tint') {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
        ctx.fillRect(borderSize, borderSize, imgWidth, imgHeight);
      }
      ctx.restore();
      currentY = borderSize * 2 + imgHeight;
    }

    // Draw Footer Text and Date
    const isDarkBackground =
      frameColor === '#18181b' ||
      frameColor.startsWith('gradient:');

    // Text color selection based on dark/light frame background
    let textColor = '#475569'; // default Slate-600
    if (isDarkBackground) {
      textColor = '#ffffff';
    } else if (frameColor === '#ffffff') {
      textColor = '#475569';
    } else if (frameColor === '#fce7f3') {
      textColor = '#be185d'; // Dark Pink
    } else if (frameColor === '#dbeafe') {
      textColor = '#1d4ed8'; // Dark Blue
    } else if (frameColor === '#fef3c7') {
      textColor = '#b55309'; // Dark Amber
    } else if (frameColor === '#f3e8ff') {
      textColor = '#6b21a8'; // Dark Purple
    } else if (frameColor === '#d1fae5') {
      textColor = '#065f46'; // Dark Emerald
    }

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';

    // Title Font with fontStyle support
    const fontFamilies: Record<string, string> = {
      sans: 'system-ui, -apple-system, sans-serif',
      cursive: '"Caveat", "Comic Sans MS", cursive, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      display: '"Impact", "Trebuchet MS", sans-serif',
      mono: 'Courier New, monospace',
    };
    const selectedFont = fontFamilies[options.fontStyle || 'sans'] || fontFamilies.sans;
    ctx.font = `bold 22px ${selectedFont}`;
    ctx.fillText(
      frameText || 'SWEET BOOTH',
      canvasWidth / 2,
      currentY + 45
    );

    // Date Font
    if (showDate) {
      ctx.font = `13px ${selectedFont}`;
      ctx.fillStyle = isDarkBackground ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0,0,0,0.4)';
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      ctx.fillText(dateStr, canvasWidth / 2, currentY + 75);
    }
  }

  // Draw Sticker Overlays if present
  if (options.stickers && options.stickers.length > 0) {
    options.stickers.forEach((st) => {
      ctx.save();
      const sx = (st.x / 100) * canvasWidth;
      const sy = (st.y / 100) * canvasHeight;
      ctx.translate(sx, sy);
      ctx.rotate((st.rotation * Math.PI) / 180);
      const fontSize = Math.round(36 * (st.scale || 1));
      ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(st.emoji, 0, 0);
      ctx.restore();
    });
  }

  return canvas.toDataURL('image/png');
};
