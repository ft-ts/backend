export interface JwtPayload {
  id: number;
  uid: number;
  email: string;
  twoFactorAuth: boolean;
}
