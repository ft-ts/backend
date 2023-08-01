export const gameConstants = {
  canvasWidth: 600,
  canvasHeight: 600,
};
  
export const ballConstatns = {
ballWidth: 40,
ballHeight: 40,
ballSpeed: 5,
startPosition: {
  x: gameConstants.canvasWidth / 2,
  y: gameConstants.canvasHeight / 2,
},
};

export const paddleConstants = {
paddleWidth: 20,
paddleHeight: 300,
paddleSpeed: 20,
homePlayerStartPos: {
  x: 20,
  y: (gameConstants.canvasHeight - 300) / 2,
},
awayPlayerStartPos: {
  x: gameConstants.canvasWidth - 20,
  y: (gameConstants.canvasHeight - 300) / 2,
},
};

export const entityType = {
BALL: 'ball',
HOMEPLAYER: 'homePlayer',
AWAYPLAYER: 'awayPlayer',
};

export const input = {
UP: 'up',
DOWN: 'down',
};
