"use client";

import React, { useMemo } from "react";

interface QRCodeSVGProps extends React.SVGProps<SVGSVGElement> {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
}

// ----------------------------------------------------------------------------
// Minimal, zero-dependency pure TypeScript QR Code Model 2 Matrix Generator
// Compatible with standard QR scanners (camera, barcode readers).
// ----------------------------------------------------------------------------

// GF(256) math for Reed-Solomon Error Correction
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP_TABLE[i] = x;
  EXP_TABLE[i + 255] = x;
  LOG_TABLE[x] = i;
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

function polyMul(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    poly = polyMul(poly, [1, EXP_TABLE[i]]);
  }
  return poly;
}

function calculateEC(data: number[], ecCount: number): number[] {
  const gen = getGeneratorPoly(ecCount);
  const remainder = [...data, ...new Array(ecCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const lead = remainder[i];
    if (lead !== 0) {
      for (let j = 0; j < gen.length; j++) {
        remainder[i + j] ^= gfMul(gen[j], lead);
      }
    }
  }
  return remainder.slice(data.length);
}

// Version configs for standard Byte Mode (Version 2 to 4)
// Version 2: 25x25 (total 44 codewords, 16 EC for M -> 28 data bytes)
// Version 3: 29x29 (total 70 codewords, 26 EC for M -> 44 data bytes)
// Version 4: 33x33 (total 100 codewords, 36 EC for M -> 64 data bytes)
interface VersionSpec {
  version: number;
  size: number;
  totalCodewords: number;
  ecCodewords: number;
  dataCodewords: number;
  alignPos: number[];
}

const VERSIONS: VersionSpec[] = [
  { version: 2, size: 25, totalCodewords: 44, ecCodewords: 16, dataCodewords: 28, alignPos: [6, 18] },
  { version: 3, size: 29, totalCodewords: 70, ecCodewords: 26, dataCodewords: 44, alignPos: [6, 22] },
  { version: 4, size: 33, totalCodewords: 100, ecCodewords: 36, dataCodewords: 64, alignPos: [6, 26] },
];

function generateQRMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(text);

  // Pick smallest fitting version
  const spec =
    VERSIONS.find((v) => v.dataCodewords >= rawBytes.length + 3) ??
    VERSIONS[VERSIONS.length - 1];

  const size = spec.size;
  // Initialize grid: null = unassigned, true = black, false = white
  const grid: (boolean | null)[][] = Array.from({ length: size }, () =>
    new Array(size).fill(null),
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    new Array(size).fill(false),
  );

  function setModule(r: number, c: number, val: boolean, functional = false) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      grid[r][c] = val;
      if (functional) isFunction[r][c] = true;
    }
  }

  // 1. Finder Patterns (7x7) + Separators
  function drawFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          setModule(nr, nc, false, true);
        } else if (r === 0 || r === 6 || c === 0 || c === 6) {
          setModule(nr, nc, true, true);
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          setModule(nr, nc, true, true);
        } else {
          setModule(nr, nc, false, true);
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Alignment Patterns (5x5)
  for (const r of spec.alignPos) {
    for (const c of spec.alignPos) {
      if (isFunction[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const isCenter = dr === 0 && dc === 0;
          setModule(r + dr, c + dc, isBorder || isCenter, true);
        }
      }
    }
  }

  // 3. Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setModule(6, i, i % 2 === 0, true);
    if (!isFunction[i][6]) setModule(i, 6, i % 2 === 0, true);
  }

  // 4. Dark Module
  setModule(size - 8, 8, true, true);

  // 5. Build Data Stream (Byte mode: 0100 + 8-bit length + data + 0000 terminator + pad bytes)
  const bitArray: number[] = [0, 1, 0, 0];
  const len = rawBytes.length;
  for (let b = 7; b >= 0; b--) {
    bitArray.push((len >> b) & 1);
  }
  for (const byte of rawBytes) {
    for (let b = 7; b >= 0; b--) {
      bitArray.push((byte >> b) & 1);
    }
  }
  // Terminator
  for (let i = 0; i < 4 && bitArray.length < spec.dataCodewords * 8; i++) {
    bitArray.push(0);
  }
  // Align to byte boundary
  while (bitArray.length % 8 !== 0) {
    bitArray.push(0);
  }
  // Convert to codewords
  const dataCodewords: number[] = [];
  for (let i = 0; i < bitArray.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bitArray[i + b];
    }
    dataCodewords.push(byte);
  }
  // Pad bytes: alternating 0xEC (236) and 0x11 (17)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (dataCodewords.length < spec.dataCodewords) {
    dataCodewords.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  // 6. Calculate Error Correction Codewords
  const ecCodewords = calculateEC(dataCodewords, spec.ecCodewords);
  const fullCodewords = [...dataCodewords, ...ecCodewords];

  // 7. Place data bits in zig-zag pattern with Mask 0 ((r + c) % 2 === 0)
  const allBits: number[] = [];
  for (const cw of fullCodewords) {
    for (let b = 7; b >= 0; b--) {
      allBits.push((cw >> b) & 1);
    }
  }

  let bitIdx = 0;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const upward = ((size - 1 - right) / 2) % 2 === 0;
    const rowStart = upward ? size - 1 : 0;
    const rowEnd = upward ? -1 : size;
    const rowStep = upward ? -1 : 1;

    for (let r = rowStart; r !== rowEnd; r += rowStep) {
      for (const c of [right, right - 1]) {
        if (!isFunction[r][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          // Apply standard Mask 0: flip if (r + c) % 2 === 0
          const mask = (r + c) % 2 === 0;
          grid[r][c] = (bit === 1) !== mask;
        }
      }
    }
  }

  // 8. Format Information: EC Level M (00) + Mask 0 (000) -> 00000 -> masked with 0x5412 = 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  // Top-left
  const tlCoords: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  tlCoords.forEach(([r, c], idx) => {
    grid[r][c] = formatBits[idx] === 1;
    isFunction[r][c] = true;
  });
  // Top-right and bottom-left split
  const trBlCoords: [number, number][] = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1],
  ];
  trBlCoords.forEach(([r, c], idx) => {
    grid[r][c] = formatBits[idx] === 1;
    isFunction[r][c] = true;
  });

  return grid.map((row) => row.map((cell) => cell ?? false));
}

export function QRCodeSVG({
  value,
  size = 200,
  fgColor = "#0f172a",
  bgColor = "#ffffff",
  includeMargin = true,
  className,
  ...props
}: QRCodeSVGProps) {
  const matrix = useMemo(() => {
    if (!value) return [];
    try {
      return generateQRMatrix(value);
    } catch {
      return [];
    }
  }, [value]);

  if (!matrix || matrix.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-slate-100 rounded text-xs text-slate-400"
      >
        Mã vé không hợp lệ
      </div>
    );
  }

  const margin = includeMargin ? 2 : 0;
  const matrixSize = matrix.length;
  const viewBoxSize = matrixSize + margin * 2;

  return (
    <svg
      role="img"
      aria-label={`QR Code cho mã vé ${value}`}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c + margin}
              y={r + margin}
              width={1}
              height={1}
              fill={fgColor}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
