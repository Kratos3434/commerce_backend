import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { decodeToken } from './authenticator';

const prisma = new PrismaClient();

export const getProfileByToken = async (req: Request, res: Response) => {
    try {
        const bearerToken = req.headers.authorization;
        if (!bearerToken) throw "Error on getting bearer token";

        const decoded: any = decodeToken(bearerToken);
        if (!decoded) throw "Error on decoding bearer token";

        if (decoded.type !== "forgotPassword") throw "Token type is invalid!";

        const user = await prisma.user.findUnique({
            where: {
                email: decoded.email
            },
            include: {
                Profile: true
            }
        });

        if (!user) throw "Unauthorized access";

        res.status(200).json({status: true, message: "Profile", data: user});
    } catch (err) {
        res.status(401).json({status: false, error: err});
    }
}