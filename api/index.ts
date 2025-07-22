import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

let server: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!server) {
    server = await registerRoutes(app);
  }
  
  return app(req, res);
}