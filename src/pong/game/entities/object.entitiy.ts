export abstract class Entity {
  width: number;
  height: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  entityType: string;
  speed : number;

  constructor(entityType: string) {
    this.entityType = entityType;
  };

  toDto() {
    return {
      width: this.width,
      height: this.height,
      x: this.x,
      y: this.y,
      type: this.entityType,
    }
  }
}