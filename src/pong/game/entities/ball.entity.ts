import { Entity } from './object.entitiy';
import { Paddle } from './paddle.entity';
import { ballConstatns, gameConstants } from '../game.constant';
import { entityType } from '../../pong.enum';

export class Ball extends Entity {
  private player1: Paddle;
  private player2: Paddle;
  constructor(homePlayer: Paddle, awayPlayer: Paddle) {
    super(entityType.BALL);
    const randomDirection = Math.random() < 0.5 ? -1 : 1;

    this.width = ballConstatns.ballWidth;
    this.height = ballConstatns.ballHeight;
    this.x = ballConstatns.startPosition.x;
    this.y = ballConstatns.startPosition.y;
    this.speed = ballConstatns.ballSpeed;
    this.dx = randomDirection < 0 ? -1 : 1;
    this.dy = 1;
    this.player1 = homePlayer;
    this.player2 = awayPlayer;
  }

  update() : boolean{
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;

    if (this.ballCollideWithPaddle(this.player1) || this.ballCollideWithPaddle(this.player2)) {
      this.dx = -this.dx;
    } else if (this.ballCollideWithWall()) {
      this.dy = -this.dy;
    } else if (this.ballCollideWithGoal()) {
      this.resetBall();
    }

    if (this.player1.getScore() >= gameConstants.maxScore || this.player2.getScore() >= gameConstants.maxScore) {
      return (true);
    } else {
      return (false);
    }
  }

  ballCollideWithPaddle(paddle: Paddle) : boolean{
    if (this.x < paddle.x + paddle.width &&
      this.x + this.width > paddle.x && 
      this.y < paddle.y + paddle.height &&
      this.y + this.height > paddle.y) {
      return (true);
    }
    return (false);
  }

  ballCollideWithWall() : boolean{
    if (this.y + this.height >= gameConstants.canvasHeight || this.y <= 0) {
      return (true);
    }
    return (false);
  }

  ballCollideWithGoal() : boolean{
    if (this.x + this.width > gameConstants.canvasWidth) {
      this.player1.setScore(1);
      return (true);
    } else if (this.x - this.width < 0) {
      this.player2.setScore(1);
      return (true);
    }
    return (false);
  }

  resetBall() {
    this.x = ballConstatns.startPosition.x;
    this.y = ballConstatns.startPosition.y;
  }

  toDto() {
    return {
      ...super.toDto(),
    }
  }
}