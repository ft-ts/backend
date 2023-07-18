export interface JwtPayload {
  id: number;
  intraId: number;
  email: string;
  twoFactorAuth: boolean;
}
