import { Entity } from './object.entitiy'
import { paddleConstants, gameConstants } from '../game.constant'
import { keyInput, entityType } from '../../pong.enum'

export class Paddle extends Entity {
  private playerID: string;
  private score: number = 0;
  constructor(isSuper: boolean, playerID: string){
    super(isSuper ? entityType.HOMEPLAYER : entityType.AWAYPLAYER);
    this.x = isSuper ? paddleConstants.homePlayerStartPos.x : paddleConstants.awayPlayerStartPos.x;
    this.y = isSuper ? paddleConstants.homePlayerStartPos.y : paddleConstants.awayPlayerStartPos.y;
    this.width = paddleConstants.paddleWidth;
    this.height = paddleConstants.paddleHeight;
    this.speed = paddleConstants.paddleSpeed;
    this.playerID = playerID;
    this.dx = 0;
    this.dy = 0;
  }

  update(key: string) {
    let desiredDy = 0;
  
    if (key === keyInput.UP && this.y > 5)
      desiredDy = -0.5;
    else if (key === keyInput.DOWN && this.y + this.height < gameConstants.canvasHeight - 5)
      desiredDy = 0.5;
    this.dy = desiredDy;
    this.y += this.dy * this.speed;
  }
  

  getPlayerType(): string{ return (this.entityType); }

  getPlayerID(): string{ return (this.playerID); }

  getScore(): number{ return (this.score); }

  setScore(): void{ ++this.score; }

  toDto() {
    return {
      ...super.toDto(),
      score: this.score,
    }
  }
}