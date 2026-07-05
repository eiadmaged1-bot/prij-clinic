const DATA_CODEWORDS = 55;
const ECC_CODEWORDS = 15;
const SIZE = 29;

type Cell = boolean | null;

export function patientQrSvgDataUri(patientId: string) {
  const matrix = createQrMatrix(patientId);
  const moduleSize = 8;
  const quiet = 4;
  const total = (SIZE + quiet * 2) * moduleSize;
  const modules: string[] = [];

  matrix.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (!dark) return;
      modules.push(`<rect x="${(x + quiet) * moduleSize}" y="${(y + quiet) * moduleSize}" width="${moduleSize}" height="${moduleSize}"/>`);
    });
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" role="img" aria-label="Patient QR"><rect width="${total}" height="${total}" fill="#fff"/><g fill="#111827">${modules.join("")}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function createQrMatrix(value: string) {
  const data = encodeData(value);
  const ecc = reedSolomon(data, ECC_CODEWORDS);
  const bits = [...data, ...ecc].flatMap((codeword) => byteBits(codeword));
  let best = drawMatrix(bits, 0);
  let bestPenalty = penalty(best);

  for (let mask = 1; mask < 8; mask += 1) {
    const candidate = drawMatrix(bits, mask);
    const candidatePenalty = penalty(candidate);
    if (candidatePenalty < bestPenalty) {
      best = candidate;
      bestPenalty = candidatePenalty;
    }
  }

  return best.map((row) => row.map(Boolean));
}

function encodeData(value: string) {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length > 36) throw new Error("Patient QR value is too long.");

  const bits = [0, 1, 0, 0, ...byteBits(bytes.length)];
  for (const byte of bytes) bits.push(...byteBits(byte));
  bits.push(0, 0, 0, 0);
  while (bits.length % 8) bits.push(0);

  const codewords: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(bits.slice(index, index + 8).reduce((value, bit) => (value << 1) | bit, 0));
  }
  for (let pad = 0; codewords.length < DATA_CODEWORDS; pad += 1) {
    codewords.push(pad % 2 === 0 ? 0xec : 0x11);
  }
  return codewords;
}

function drawMatrix(bits: number[], mask: number) {
  const matrix: Cell[][] = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null));
  const reserved: boolean[][] = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => false));
  const set = (x: number, y: number, dark: boolean, isReserved = true) => {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    matrix[y]![x] = dark;
    reserved[y]![x] = isReserved;
  };

  addFinder(set, 0, 0);
  addFinder(set, SIZE - 7, 0);
  addFinder(set, 0, SIZE - 7);
  addAlignment(set, 22, 22);
  for (let index = 8; index < SIZE - 8; index += 1) {
    set(index, 6, index % 2 === 0);
    set(6, index, index % 2 === 0);
  }
  set(8, SIZE - 8, true);
  reserveFormat(reserved);

  let bitIndex = 0;
  let upward = true;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vert = 0; vert < SIZE; vert += 1) {
      const y = upward ? SIZE - 1 - vert : vert;
      for (let dx = 0; dx < 2; dx += 1) {
        const x = right - dx;
        if (reserved[y]![x]) continue;
        const bit = bits[bitIndex++] ?? 0;
        matrix[y]![x] = Boolean(bit) !== maskBit(mask, x, y);
      }
    }
    upward = !upward;
  }

  addFormat(matrix, mask);
  return matrix.map((row) => row.map(Boolean));
}

function addFinder(set: (x: number, y: number, dark: boolean, isReserved?: boolean) => void, x: number, y: number) {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const xx = x + dx;
      const yy = y + dy;
      const dark = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      set(xx, yy, dark);
    }
  }
}

function addAlignment(set: (x: number, y: number, dark: boolean, isReserved?: boolean) => void, cx: number, cy: number) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
}

function reserveFormat(reserved: boolean[][]) {
  for (let i = 0; i < 9; i += 1) {
    reserved[8]![i] = true;
    reserved[i]![8] = true;
    reserved[SIZE - 1 - i]![8] = true;
    reserved[8]![SIZE - 1 - i] = true;
  }
}

function addFormat(matrix: Cell[][], mask: number) {
  const bits = formatBits(mask);
  const set = (x: number, y: number, index: number) => {
    matrix[y]![x] = Boolean((bits >>> index) & 1);
  };
  for (let i = 0; i <= 5; i += 1) set(8, i, i);
  set(8, 7, 6);
  set(8, 8, 7);
  set(7, 8, 8);
  for (let i = 9; i < 15; i += 1) set(14 - i, 8, i);
  for (let i = 0; i < 8; i += 1) set(SIZE - 1 - i, 8, i);
  for (let i = 8; i < 15; i += 1) set(8, SIZE - 15 + i, i);
  matrix[SIZE - 8]![8] = true;
}

function formatBits(mask: number) {
  let data = (1 << 3) | mask;
  let rem = data << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if (((rem >>> i) & 1) !== 0) rem ^= 0x537 << (i - 10);
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function maskBit(mask: number, x: number, y: number) {
  if (mask === 0) return (x + y) % 2 === 0;
  if (mask === 1) return y % 2 === 0;
  if (mask === 2) return x % 3 === 0;
  if (mask === 3) return (x + y) % 3 === 0;
  if (mask === 4) return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
  if (mask === 5) return ((x * y) % 2) + ((x * y) % 3) === 0;
  if (mask === 6) return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
  return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
}

function penalty(matrix: boolean[][]) {
  let score = 0;
  for (const row of matrix) score += runPenalty(row);
  for (let x = 0; x < SIZE; x += 1) score += runPenalty(matrix.map((row) => row[x]!));
  for (let y = 0; y < SIZE - 1; y += 1) {
    for (let x = 0; x < SIZE - 1; x += 1) {
      const value = matrix[y]![x];
      if (matrix[y]![x + 1] === value && matrix[y + 1]![x] === value && matrix[y + 1]![x + 1] === value) score += 3;
    }
  }
  const dark = matrix.flat().filter(Boolean).length;
  score += Math.floor(Math.abs((dark * 100) / (SIZE * SIZE) - 50) / 5) * 10;
  return score;
}

function runPenalty(values: boolean[]) {
  let score = 0;
  let run = 1;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] === values[i - 1]) {
      run += 1;
      if (run === 5) score += 3;
      else if (run > 5) score += 1;
    } else {
      run = 1;
    }
  }
  return score;
}

function reedSolomon(data: number[], degree: number) {
  const gen = rsGenerator(degree);
  const result = Array.from({ length: degree }, () => 0);
  for (const byte of data) {
    const factor = byte ^ result.shift()!;
    result.push(0);
    gen.forEach((coefficient, index) => {
      result[index] = result[index]! ^ gfMul(coefficient, factor);
    });
  }
  return result;
}

function rsGenerator(degree: number) {
  let result = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = [1, gfPow(2, i)];
    const product = Array.from({ length: result.length + 1 }, () => 0);
    result.forEach((a, j) => {
      next.forEach((b, k) => {
        product[j + k] = product[j + k]! ^ gfMul(a, b);
      });
    });
    result = product;
  }
  return result.slice(1);
}

function gfMul(a: number, b: number) {
  let result = 0;
  for (; b > 0; b >>>= 1) {
    if (b & 1) result ^= a;
    a <<= 1;
    if (a & 0x100) a ^= 0x11d;
  }
  return result;
}

function gfPow(a: number, power: number) {
  let result = 1;
  for (let i = 0; i < power; i += 1) result = gfMul(result, a);
  return result;
}

function byteBits(value: number) {
  return Array.from({ length: 8 }, (_, index) => (value >>> (7 - index)) & 1);
}
