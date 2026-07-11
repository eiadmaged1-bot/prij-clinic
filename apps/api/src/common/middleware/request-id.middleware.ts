import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface RequestWithId extends Request {
  requestId: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction) {
    let headerId = req.headers['x-request-id'];
    if (Array.isArray(headerId)) {
      headerId = headerId[0];
    }
    
    // Validate it's a UUID (or at least safe alphanumeric/dashes)
    const isValidId = typeof headerId === 'string' && /^[0-9a-fA-F-]{36}$/.test(headerId);
    const requestId: string = (isValidId && typeof headerId === 'string') ? headerId : randomUUID();
    
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    
    next();
  }
}
