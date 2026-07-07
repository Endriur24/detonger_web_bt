/**
 * Canvas Editor - Library for canvas editing
 *
 * Use this file to create complex canvas editors before printing via DothanTechPrinter.
 */

// ============================================================================
// BASIC SHAPES
// ============================================================================

/**
 * Draw a rectangle.
 */
export function drawRectangle(canvas, x, y, width, height, options = {}) {
    const ctx = canvas.getContext('2d');
    const {
        fillStyle = 'black',
        strokeStyle = 'black',
        lineWidth = 2,
        fill = true,
        stroke = false
    } = options;

    if (fill) {
        ctx.fillStyle = fillStyle;
        ctx.fillRect(x, y, width, height);
    }

    if (stroke) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x, y, width, height);
    }
}

/**
 * Draw a circle.
 */
export function drawCircle(canvas, x, y, radius, options = {}) {
    const ctx = canvas.getContext('2d');
    const {
        fillStyle = 'black',
        strokeStyle = 'black',
        lineWidth = 2,
        fill = true,
        stroke = false
    } = options;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (fill) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }

    if (stroke) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
}

/**
 * Draw a line.
 */
export function drawLine(canvas, x1, y1, x2, y2, options = {}) {
    const ctx = canvas.getContext('2d');
    const {
        strokeStyle = 'black',
        lineWidth = 2,
        lineCap = 'round'
    } = options;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = lineCap;
    ctx.stroke();
}

// ============================================================================
// TEXT DRAWING
// ============================================================================

/**
 * Draw text on a canvas.
 */
export function drawText(canvas, text, x, y, options = {}) {
    const ctx = canvas.getContext('2d');
    const {
        fontSize = 24,
        fontFamily = 'Arial',
        fontWeight = 'normal',
        fontStyle = 'normal',
        fillStyle = 'black',
        textAlign = 'left',
        textBaseline = 'top',
        maxWidth = undefined
    } = options;

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fillStyle;
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;

    if (maxWidth) {
        ctx.fillText(text, x, y, maxWidth);
    } else {
        ctx.fillText(text, x, y);
    }
}

/**
 * Draw multi-line text with wrapping.
 */
export function drawWrappedText(canvas, text, x, y, maxWidth, options = {}) {
    const ctx = canvas.getContext('2d');
    const {
        fontSize = 24,
        fontFamily = 'Arial',
        fontWeight = 'normal',
        fontStyle = 'normal',
        fillStyle = 'black',
        lineHeight = 1.2,
        textAlign = 'left'
    } = options;

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fillStyle;
    ctx.textAlign = textAlign;

    const lines = wrapText(ctx, text, maxWidth);
    let currentY = y;

    lines.forEach((line) => {
        let drawX = x;
        if (textAlign === 'center') {
            drawX = x - ctx.measureText(line).width / 2;
        } else if (textAlign === 'right') {
            drawX = x - ctx.measureText(line).width;
        }

        ctx.fillText(line, drawX, currentY);
        currentY += fontSize * lineHeight;
    });
}

/**
 * Helper function for text wrapping.
 */
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

// ============================================================================
// BORDERS AND FRAMES
// ============================================================================

/**
 * Draw a simple border.
 */
export function drawBorder(canvas, options = {}) {
    const {
        borderWidth = 2,
        borderColor = 'black',
        padding = 0
    } = options;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(padding, padding, canvas.width - padding * 2, canvas.height - padding * 2);
}

/**
 * Draw a double border.
 */
export function drawDoubleBorder(canvas, options = {}) {
    const {
        borderWidth1 = 4,
        borderWidth2 = 2,
        borderColor = 'black',
        padding = 0
    } = options;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = borderColor;

    ctx.lineWidth = borderWidth1;
    ctx.strokeRect(padding, padding, canvas.width - padding * 2, canvas.height - padding * 2);

    ctx.lineWidth = borderWidth2;
    ctx.strokeRect(padding + 6, padding + 6, canvas.width - padding * 2 - 12, canvas.height - padding * 2 - 12);
}

/**
 * Draw a rounded border.
 */
export function drawRoundedBorder(canvas, options = {}) {
    const {
        borderWidth = 2,
        borderColor = 'black',
        radius = 10,
        padding = 0
    } = options;

    const ctx = canvas.getContext('2d');
    const x = padding;
    const y = padding;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
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
    ctx.stroke();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear the canvas with a color.
 */
export function clearCanvas(canvas, color = 'white') {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Fill the canvas with a color.
 */
export function fillCanvas(canvas, color) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw a helper grid.
 */
export function drawGrid(canvas, options = {}) {
    const {
        gridSize = 20,
        gridColor = '#cccccc',
        lineWidth = 1
    } = options;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = lineWidth;

    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

/**
 * Resize the canvas.
 */
export function resizeCanvas(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
}

// ============================================================================
// BARCODE GENERATION (simplified)
// ============================================================================

/**
 * Draw a simple barcode (Code 39 style).
 */
export function drawBarcode(canvas, text, options = {}) {
    const {
        x = 20,
        y = 20,
        barWidth = 2,
        barHeight = 50,
        showText = true,
        fontSize = 12
    } = options;

    const ctx = canvas.getContext('2d');

    let currentX = x;
    const pattern = [1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2];

    ctx.fillStyle = 'black';
    pattern.forEach((width, index) => {
        if (index % 2 === 0) {
            ctx.fillRect(currentX, y, width * barWidth, barHeight);
        }
        currentX += width * barWidth;
    });

    if (showText) {
        drawText(canvas, text, x + (currentX - x) / 2, y + barHeight + 15, {
            fontSize,
            textAlign: 'center'
        });
    }
}

// ============================================================================
// EXAMPLE: CREATE A SIMPLE RECEIPT
// ============================================================================

/**
 * Example: Create a simple receipt.
 */
export function createSimpleReceipt(canvas, options = {}) {
    const {
        shopName = 'SHOP DEMO',
        date = new Date().toLocaleDateString('en-US'),
        items = [
            { name: 'Product 1', price: 10.00 },
            { name: 'Product 2', price: 25.50 },
            { name: 'Product 3', price: 5.00 }
        ],
        totalText = 'TOTAL:',
        showBorder = true
    } = options;

    clearCanvas(canvas);

    let y = 20;
    const centerX = canvas.width / 2;

    drawText(canvas, shopName, centerX, y, {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center'
    });
    y += 40;

    drawText(canvas, date, centerX, y, {
        fontSize: 16,
        textAlign: 'center'
    });
    y += 40;

    drawLine(canvas, 20, y, canvas.width - 20, y, { lineWidth: 2 });
    y += 20;

    items.forEach((item) => {
        drawText(canvas, item.name, 30, y, { fontSize: 18 });
        drawText(canvas, '$' + item.price.toFixed(2), canvas.width - 30, y, {
            fontSize: 18,
            textAlign: 'right'
        });
        y += 30;
    });

    drawLine(canvas, 20, y, canvas.width - 20, y, { lineWidth: 2 });
    y += 20;

    const total = items.reduce((sum, item) => sum + item.price, 0);
    drawText(canvas, totalText, 30, y, {
        fontSize: 20,
        fontWeight: 'bold'
    });
    drawText(canvas, '$' + total.toFixed(2), canvas.width - 30, y, {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'right'
    });

    if (showBorder) {
        drawDoubleBorder(canvas);
    }

    return canvas;
}

export default {
    clearCanvas,
    fillCanvas,
    drawRectangle,
    drawCircle,
    drawLine,
    drawText,
    drawWrappedText,
    drawBorder,
    drawDoubleBorder,
    drawRoundedBorder,
    drawGrid,
    drawBarcode,
    createSimpleReceipt
};
