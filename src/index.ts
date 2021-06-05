/**
 * Usage: node index <file>
 */

import 'colors';
const fs = require('fs');
const path = require('path');

// The input file is given by command line argument
const INPUT_FILE = process.argv[2];

// Read and parse two sequences from the input file
const [firstLine, secondLine] = fs
  .readFileSync(path.join(__dirname, INPUT_FILE))
  .toString()
  .split(/\r?\n/)
  .map(String);

// console.log({ firstLine, secondLine });

class _Node {
  //   nucleotide: string; // A | T | C | G
  cost: number; // path cost
  x: number;
  y: number;
  from: _Node | null;

  //   constructor(nucleotide: string, cost = 0) {
  constructor(cost = 0, x = 0, y = 0) {
    // this.nucleotide = nucleotide;
    this.cost = cost;
    this.x = x;
    this.y = y;
    this.from = null;
  }
}

class Matrix {
  private table: Array<Array<_Node>> | undefined;
  private first: string;
  private second: string;
  private path: Array<_Node> | undefined;
  private alignedSequences: { first: string; second: string } | undefined;

  constructor(first: string, second: string) {
    this.first = first;
    this.second = second;

    this.createEmptyTable(this.second.length + 1, this.first.length + 1);

    this.calculateScores();
  }

  createEmptyTable(x: number, y: number) {
    let matrix = [];
    for (let i = 0; i < y; i++) {
      matrix.push(new Array(x));
    }

    const startingNode = new _Node(0, 0, 0);
    matrix[0][0] = startingNode;

    this.table = matrix;
  }

  private getLeftNode = (current: _Node): _Node | null => {
    try {
      const left = this.table[current.x][current.y - 1];
      return left;
    } catch (error) {
      return null;
    }
  };

  private getTopNode = (current: _Node): _Node | null => {
    try {
      const left = this.table[current.x - 1][current.y];
      return left;
    } catch (error) {
      return null;
    }
  };

  from = (current: _Node): 'left' | 'top' | 'diagonal' => {
    if (current.from.x === current.x) return 'left';
    if (current.from.y === current.y) return 'top';
    return 'diagonal';
  };

  private getScoredNode = (x: number, y: number): _Node => {
    // console.log({ x, y });
    const newNode = new _Node(null, x, y);

    // check left Node, if it is also came from its left use -0.5, use -1 otherwise
    let leftScore = Number.MIN_SAFE_INTEGER;

    try {
      const leftNode = this.getLeftNode(newNode);

      if (leftNode) {
        try {
          if (this.from(leftNode) === 'left') {
            leftScore = leftNode.cost - 0.5;
          } else {
            leftScore = leftNode.cost - 1;
          }
        } catch (error) {
          leftScore = leftNode.cost - 1;
        }
      }
    } catch (error) {}

    // check top Node, if it is also came from its top use -0.5, use -1 otherwise
    let topScore = Number.MIN_SAFE_INTEGER;

    try {
      const topNode = this.getTopNode(newNode);

      if (topNode) {
        try {
          if (this.from(topNode) === 'top') {
            topScore = topNode.cost - 0.5;
          } else {
            topScore = topNode.cost - 1;
          }
        } catch (error) {
          topScore = topNode.cost - 1;
        }
      }
    } catch (error) {}

    // check diagonal, if it's a match use +2 score, -1 otherwise
    const isMatch = this.first[x - 1] === this.second[y - 1]; // it's a match

    let diagonalScore = Number.MIN_SAFE_INTEGER;

    try {
      if (isMatch) {
        diagonalScore = this.table[x - 1][y - 1].cost + 2;
      } else {
        diagonalScore = this.table[x - 1][y - 1].cost - 1;
      }
    } catch (error) {}

    // console.log({ leftScore, topScore, diagonalScore });

    const maxScore = Math.max(leftScore, topScore, diagonalScore);

    if (maxScore === leftScore) {
      newNode.from = this.getLeftNode(newNode);
    } else if (maxScore === topScore) {
      newNode.from = this.getTopNode(newNode);
    } else {
      newNode.from = this.table[x - 1][y - 1];
    }
    newNode.cost = maxScore;
    // console.log({ newNode });
    return newNode;
  };

  calculateScores = () => {
    // calculate score for firs lines
    for (let i = 1; i < this.second.length + 1; i++) {
      const tempNode = this.getScoredNode(0, i);
      this.table[0][i] = tempNode;
    }
    for (let i = 1; i < this.first.length + 1; i++) {
      const tempNode = this.getScoredNode(i, 0);
      this.table[i][0] = tempNode;
    }

    // calculate score of rest
    for (let i = 1; i < this.first.length + 1; i++) {
      for (let j = 1; j < this.second.length + 1; j++) {
        const tempNode = this.getScoredNode(i, j);
        this.table[i][j] = tempNode;
      }
    }
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
      const mapped = this.table[i]
        .map((x) => x.cost)
        .map((x) => String(x).padStart(pad));

      if (i > 0) {
        process.stdout.write(` ${this.first[i - 1]} `.bgCyan);
      } else {
        process.stdout.write(`   `.bgCyan);
      }
      console.log(mapped.join(' '));
    }
  };

  getScore = () => {
    return this.table[this.first.length][this.second.length].cost;
  };

  getSink = (): _Node => {
    return this.table[this.first.length][this.second.length];
  };

  // build the path by following marked nodes
  buildPath = () => {
    let pathArray = [];
    let current = this.getSink();
    do {
      pathArray.push(current);
      current = current.from;
    } while (current.from !== null);
    this.path = pathArray.reverse();
  };

  private getLabel = (current: _Node): { first: string; second: string } => {
    // console.log({ x: current.x, y: current.y });
    let first = '-';
    let second = '-';

    const from = matrix.from(current);

    switch (from) {
      case 'left':
        second = this.second[current.y - 1];
        break;

      case 'top':
        first = this.first[current.x - 1];
        break;
      default:
        // diagonal
        second = this.second[current.y - 1];
        first = this.first[current.x - 1];
        break;
    }

    return { first, second };
  };

  buildSequences = () => {
    let firstSequence = '';
    let secondSequence = '';
    for (let i = 0; i < this.path.length; i++) {
      const pathNode = this.path[i];

      const { first, second } = this.getLabel(pathNode);

      firstSequence += first;
      secondSequence += second;
    }

    this.alignedSequences = {
      first: firstSequence,
      second: secondSequence,
    };
  };

  printAlignedSequences = (): void => {
    console.log(this.alignedSequences.first);
    console.log(this.alignedSequences.second);
  };

  printResult = (): void => {
    this.printAlignedSequences();
    console.log('Score:', this.getScore());
  };

  // save the table into a file
  save = () => {
    fs.writeFileSync(
      'dump.json',
      JSON.stringify(this.table).replace(/\],\[/gm, '],\n[')
    );
  };
}

const matrix = new Matrix(firstLine, secondLine);

matrix.buildPath();
matrix.buildSequences();
matrix.printResult();

// matrix.printScoresTable();
// matrix.save();
