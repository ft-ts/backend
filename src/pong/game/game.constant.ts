export const gameConstants = {
  canvasWidth: 1024,
  canvasHeight: 500,
  gameInterval: 1000/30,
  maxScore: 2,
  ballSpeed: 5,
};
  
export const ballConstatns = {
ballWidth: 20,
ballHeight: 20,
ballSpeed: gameConstants.ballSpeed,
startPosition: {
  x: (gameConstants.canvasWidth - 40) / 2,
  y: (gameConstants.canvasHeight - 40) / 2,
},
};

export const paddleConstants = {
paddleWidth: 20,
paddleHeight: 185,
paddleSpeed: 20,
homePlayerStartPos: {
  x: 20,
  y: (gameConstants.canvasHeight - 200) / 2,
},
awayPlayerStartPos: {
  x: gameConstants.canvasWidth - 40,
  y: (gameConstants.canvasHeight - 200) / 2,
},
};
