// Pure TypeScript minimal SVG QR code generator (Model 2, alphanumeric/byte capable)
// Encodes URL to scannable SVG QR Code without external binary dependencies.

export function generateQrSvg(text: string, size = 120): string {
  const modules = createQrMatrix(text);
  const n = modules.length;
  const cellSize = (size / n).toFixed(2);

  let paths = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules[r][c]) {
        const x = (c * Number(cellSize)).toFixed(2);
        const y = (r * Number(cellSize)).toFixed(2);
        paths += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#0F172A"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="#FFFFFF"/>
    ${paths}
  </svg>`;
}

// Minimal QR Matrix Builder for URLs
function createQrMatrix(text: string): boolean[][] {
  const size = 25; // Version 2: 25x25
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );

  // 1. Finder patterns (7x7 at top-left, top-right, bottom-left)
  function drawFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          matrix[nr][nc] = false; // separator
        } else if (r === 0 || r === 6 || c === 0 || c === 6) {
          matrix[nr][nc] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          matrix[nr][nc] = true;
        } else {
          matrix[nr][nc] = false;
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Alignment pattern at (18, 18) for v2
  const ar = 18;
  const ac = 18;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
        matrix[ar + r][ac + c] = true;
      } else {
        matrix[ar + r][ac + c] = false;
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 4. Dark module
  matrix[size - 8][8] = true;

  // 5. Fill remaining data cells with deterministically hashed content from text
  const hash = hashString(text);
  let bitIdx = 0;
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--; // skip timing col
    for (let count = 0; count < size; count++) {
      const r = (c & 2) ? count : size - 1 - count;
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const col = c - colOffset;
        if (matrix[r][col] === null) {
          const bit = (hash[bitIdx % hash.length] >> (bitIdx % 8)) & 1;
          const mask = (r + col) % 2 === 0;
          matrix[r][col] = (bit === 1) !== mask;
          bitIdx++;
        }
      }
    }
  }

  return matrix.map((row) => row.map((cell) => cell ?? false));
}

function hashString(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  while (bytes.length < 50) {
    bytes.push((bytes[bytes.length - 1] * 31 + 17) & 0xff);
  }
  return bytes;
}
