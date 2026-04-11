import { Request, Response, NextFunction } from "express";

export function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers["x-webhook-secret"];
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
