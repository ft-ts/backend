import { Entity } from './object.entitiy'
import { paddleConstants, entityType, gameConstants } from '../game.constant'

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
    const isUp : boolean = key === 'up' ? true : false;
    const isDown : boolean = key === 'down' ? true : false;
    if (isUp && this.y + this.height > 0) {
      this.dy = -1;
    } else if (isDown && this.y < gameConstants.canvasHeight - this.height) {
      this.dy = 1;
    } else {
      this.dy = 0;
    }
    this.y += this.dy * this.speed;
  }

  getPlayerID(): string{ return (this.playerID); }

  getScore(): number{ return (this.score); }

  setScore(): void{ ++this.score; }

  toDto() {
    return {
      ...super.toDto(),
    }
  }
}