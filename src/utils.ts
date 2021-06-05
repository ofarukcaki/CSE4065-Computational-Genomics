export const createMatrix = (x: number, y: number) => {
  let matrix = [];
  for (let i = 0; i < y; i++) {
    matrix.push(new Array(x));
  }
  return matrix;
};

export const initializeMatrix = (
  matrix: Array<any>,
  firstSequence: string,
  secondSequence: string
) => {
  for (let i = 1; i < secondSequence.length + 1; i++) {
    matrix[0][i] = secondSequence[i - 1];
  }
  for (let i = 1; i < firstSequence.length + 1; i++) {
    matrix[i][0] = firstSequence[i - 1];
  }
};
