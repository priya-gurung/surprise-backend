import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

import { env, corsOrigins } from './config/env.js'
import { generalLimiter } from './middleware/rateLimit.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import wishlistRoutes from './routes/wishlists.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1) // needed for correct rate-limiting/secure cookies behind Render's proxy

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }))

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser requests (Postman, curl, same-origin)
        if (!origin) return callback(null, true);

        // Normalize origin by stripping any trailing slashes
        const normalizedOrigin = origin.replace(/\/$/, '');
        const normalizedAllowed = corsOrigins.map((o) => o.replace(/\/$/, ''));

        if (normalizedAllowed.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        // Log the rejected origin so you can inspect it in your terminal
        console.error(`[CORS Blocked] Incoming Origin: "${origin}"`);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
  }
  app.use(generalLimiter)

  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }))
  app.use('/api', wishlistRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
