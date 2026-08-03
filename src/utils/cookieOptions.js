const isProduction = process.env.NODE_ENV === 'production'

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: isProduction ? 'none' : 'lax',
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};