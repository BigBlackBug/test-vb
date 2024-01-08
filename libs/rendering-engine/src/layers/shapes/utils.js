/* eslint-disable import/prefer-default-export */
/**
 * Gets the number of verticies of path.
 *
 * @param      {Object}  pathData  The path data from bodymovin (the 'ks' or 'pt' key of a shape object)
 * @return     {Number}  The number of verticies of path.
 */
export const getVerticiesOfPath = (pathData) => {
    let pointData;
    // If it's animated, use the first point, as you can't tween the number of points
    if (pathData.a) {
        [pointData] = pathData.k[0].s;
    } else {
        pointData = pathData.k;
    }

    // The 'v' key is for the number of verticies
    return pointData.v.length;
};