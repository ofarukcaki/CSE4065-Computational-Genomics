/**
 * Usage: node index <file>
 */

import { createMatrix, initializeMatrix } from './utils';
import 'colors';

const fs = require('fs');
const path = require('path');
const colors = require('colors');

// The input file is given by command line argument
const INPUT_FILE = process.argv[2];

// Read and parse two sequences from the input file
const [firstLine, secondLine] = fs
  .readFileSync(path.join(__dirname, INPUT_FILE))
  .toString()
  .split(/\r?\n/)
  .map(String);

console.log({ firstLine, secondLine });

class _Node {
  //   nucleotide: string; // A | T | C | G
  cost: number; // path cost

  //   constructor(nucleotide: string, cost = 0) {
  constructor(cost = 0) {
    // this.nucleotide = nucleotide;
    this.cost = cost;
  }
}

const isNumber = (value) => {
  return typeof value === 'number' && isFinite(value);
};

class Matrix {
  table: Array<Array<any>>;
  first: string;
  second: string;

  constructor(first: string, second: string) {
    this.first = first;
    this.second = second;

    this.createEmptyTable(this.second.length + 1, this.first.length + 1);
    // this.initializeMatrix();

    this.calculateScores();
  }

  createEmptyTable(x: number, y: number) {
    let matrix = [];
    for (let i = 0; i < y; i++) {
      matrix.push(new Array(x));
    }

    matrix[0][0] = 0;
    this.table = matrix;
  }

  initializeMatrix = () => {
    for (let i = 1; i < this.second.length + 1; i++) {
      this.table[0][i] = this.second[i - 1];
    }
    for (let i = 1; i < this.first.length + 1; i++) {
      this.table[i][0] = this.first[i - 1];
    }
  };

  calculateScores = () => {
    // calculate score for firs lines
    for (let i = 1; i < this.second.length + 1; i++) {
      this.table[0][i] = this.getScore(0, i);
    }
    for (let i = 1; i < this.first.length + 1; i++) {
      this.table[i][0] = this.getScore(i, 0);
    }

    // calculate score of rest
    for (let i = 1; i < this.first.length + 1; i++) {
      for (let j = 1; j < this.first.length; j++) {
        this.table[i][j] = this.getScore(i, j);
        // if (i === 1 && j === 1) return;
      }
    }
  };

  // get the match, mismatch or affine gap penalty score by checking all inputs
  //   private getScore = (x: number, y: number) => {
  getScore = (x: number, y: number) => {
    // console.log({ x, y });
    // check left
    let left: number;
    try {
      left = this.table[x][y - 1] - 1;
    } catch (e) {}
    left = isNumber(left) ? left : Number.MIN_SAFE_INTEGER;
    // console.log('left: ', left);

    // check top
    let top: number;
    try {
      top = this.table[x - 1][y] - 1;
    } catch (e) {}
    top = isNumber(top) ? top : Number.MIN_SAFE_INTEGER;
    // console.log('top: ', top);

    // check corner
    const isMatch = this.first[x - 1] === this.second[y - 1];

    let corner: number;
    try {
      corner = this.table[x - 1][y - 1];
    } catch (e) {}
    corner = isNumber(corner) ? corner : Number.MIN_SAFE_INTEGER;

    if (isMatch) {
      corner += 2;
    } else {
      corner -= 1;
    }
    // console.log('corner: ', corner);

    const max = Math.max(left, top, corner);
    // console.log({ max, isMatch });

    return max;
  };

  printScoresTable = () => {
    const pad = 3; // pad size
    console.log(
      `       ${this.second
        .split('')
        .map((x) => String(x).padStart(pad))
        .join(' ')}`.bgCyan
    );

    for (let i = 0; i < this.table.length; i++) {
      const mapped = this.table[i].map((x) => String(x).padStart(pad));

      if (i > 0) {
        process.stdout.write(` ${this.first[i - 1]} `.bgCyan);
      } else {
        process.stdout.write(`   `.bgCyan);
      }
      console.log(mapped.join(' '));
    }
  };
}

let matrix = new Matrix(firstLine, secondLine);

matrix.printScoresTable();
