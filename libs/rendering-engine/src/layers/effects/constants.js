/* Within the array of length 20 that represents a 4x5 matrix expected by `ColorMatrixFilter`,
these are the indeces that "override" the existing pixel values during matrix multiplication,
which we use to mimic the fill effect. */
/* eslint-disable-next-line import/prefer-default-export */
export const matrixIndeces = {
    red: 4,
    green: 9,
    blue: 14,
    alpha: 18,
};