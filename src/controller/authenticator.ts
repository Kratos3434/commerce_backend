import fs from 'fs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const decodeToken = (bearerToken: string) => {
    if (bearerToken === "undefined" || !bearerToken) {
        throw "Bearer token is missing";
      }
  
      const token = bearerToken.split(" ")[1];
  
      const privateKey = fs.readFileSync("privateKey.key");
  
      return jwt.verify(token, privateKey);
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        const bearerToken = req.headers.authorization;

        if (!bearerToken) throw "Unauthorized";

        const result = decodeToken(bearerToken);

        if (!result) throw "Unauthorized";

        next();
    } catch (err) {
        res.status(401).json({status: false, error: err});
    }
}