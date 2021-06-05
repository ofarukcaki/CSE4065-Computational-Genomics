/**
 * Compile: npm run build
 * Usage: node ./build/index.js <file>
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

// each node on the 2D grid is _Node object
class _Node {
  cost: number; // path cost until this node
  x: number; // x coordinate on the grid
  y: number; // y coordinate on the grid
  from: _Node | null; // the node on the path which pointed this node

  constructor(cost = 0, x = 0, y = 0) {
    this.cost = cost;
    this.x = x;
    this.y = y;
    this.from = null;
  }
}

class Matrix {
  private table: Array<Array<_Node>> | undefined; // 2D array, grid representation
  private first: string; // first sequence string
  private second: string; // second sequence string
  private path: Array<_Node> | undefined; // path from start to sink
  private alignedSequences: { first: string; second: string } | undefined; // final alignment results constructed from the solution path

  constructor(first: string, second: string) {
    this.first = first;
    this.second = second;

    this.createEmptyTable(this.second.length + 1, this.first.length + 1);

    this.calculateScores();

    this.buildPath();
    this.buildSequences();
  }

  // build the base empty 2D array
  createEmptyTable(x: number, y: number) {
    let matrix = [];
    for (let i = 0; i < y; i++) {
      matrix.push(new Array(x));
    }

    const startingNode = new _Node(0, 0, 0);
    matrix[0][0] = startingNode;

    this.table = matrix;
  }

  // get the node which is on the left side of current node on the grid
  private getLeftNode = (current: _Node): _Node | null => {
    try {
      const left = this.table[current.x][current.y - 1];
      return left;
    } catch (error) {
      return null;
    }
  };

  // get the node which is on the top of current node on the grid
  private getTopNode = (current: _Node): _Node | null => {
    try {
      const left = this.table[current.x - 1][current.y];
      return left;
    } catch (error) {
      return null;
    }
  };

  // get the previous move which resulted current position
  private from = (current: _Node): 'left' | 'top' | 'diagonal' => {
    if (current.from.x === current.x) return 'left';
    if (current.from.y === current.y) return 'top';
    return 'diagonal';
  };

  private getScoredNode = (x: number, y: number): _Node => {
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

    const maxScore = Math.max(leftScore, topScore, diagonalScore);

    if (maxScore === leftScore) {
      newNode.from = this.getLeftNode(newNode);
    } else if (maxScore === topScore) {
      newNode.from = this.getTopNode(newNode);
    } else {
      newNode.from = this.table[x - 1][y - 1];
    }
    newNode.cost = maxScore;

    return newNode;
  };

  // iterate all the empty cells and create node for each
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

  // get final score for the current solution
  getScore = () => {
    return this.table[this.first.length][this.second.length].cost;
  };

  // get the sink _Node
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

  // returns the corresponding nucleodides or indels by checking the move
  private getLabel = (current: _Node): { first: string; second: string } => {
    let first = '-';
    let second = '-';

    const from = this.from(current);

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

  // using the solution path build the alligned sequences
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

  // same with above func. but prints the colored output by matching status
  printColoredSequences = (): void => {
    const { first, second } = this.alignedSequences;
    // print first seq
    for (let i = 0; i < first.length; i++) {
      if (first[i] === second[i]) {
        process.stdout.write(`${first[i]}`.green);
      } else if (!(first[i] === '-' || second[i] === '-')) {
        process.stdout.write(`${first[i]}`.red);
      } else {
        process.stdout.write(`${first[i]}`);
      }
    }
    process.stdout.write('\n');
    
    // print second seq
    for (let i = 0; i < first.length; i++) {
      if (first[i] === second[i]) {
        process.stdout.write(`${second[i]}`.green);
      } else if (!(first[i] === '-' || second[i] === '-')) {
        process.stdout.write(`${second[i]}`.red);
      } else {
        process.stdout.write(`${second[i]}`);
      }
    }
    process.stdout.write('\n');

  };

  printResult = (): void => {
    this.printColoredSequences();
    console.log('Score:', this.getScore(), '\n');
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

matrix.printResult();

// matrix.printScoresTable();
// matrix.save();
