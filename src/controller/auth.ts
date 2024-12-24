import { PrismaClient } from "@prisma/client";
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import randomstring from 'randomstring';
import { sendOtp, sendPasswordResetLink } from "./email";
import { decodeToken } from "./authenticator";
import { isOneDayOld, isOneMinuteOld } from "./utils";

const prisma = new PrismaClient();

export const signin = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        if (!email) throw "Email is required";
        if (!password) throw "Password is required";

        const user = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (!user) throw "Incorrect email or password";

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) throw "Incorrect email or password";

        const profile = await prisma.profile.findUnique({
            where: {
                userId: user.id
            },
            include: {
                User: {
                    select: {
                        email: true
                    }
                }
            }
        });

        const privateKey = fs.readFileSync('privateKey.key');

        if (!user.verified) {
            const verifyToken = jwt.sign({ email, type: "verify" }, privateKey, {
                expiresIn: '30 days',
                algorithm: 'RS256'
            });
    
            res.cookie("verifyToken", verifyToken, {
                httpOnly: true,
                maxAge: 2629743744,
                secure: true
            });

            res.status(401).json({ status: false, error: "User not verified", data: profile });
            return;
        }


        const token = jwt.sign({ email: user.email, id: user.id, type: "login" }, privateKey, {
            expiresIn: '30 days',
            algorithm: 'RS256'
        });

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 2629743744,
            secure: true
        });

        res.status(200).json({status: true, message: "Login successful", data: profile});
    } catch (err) {
        res.status(400).json({status: false, error: err});
    }
}


export const signup = async (req: Request, res: Response) => {
    const { email, firstName, lastName, password, password2 } = req.body;
    try {
        if (!email) throw "Email is required";
        if (!firstName) throw "First name is rquired";
        if (!lastName) throw "Last name is required";
        if (!password) throw "Password is required";
        if (!password2) throw "Please confirm your password";
        if (password !== password2) throw "Passwords do not match";
        
        const user = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (user) throw "Email is already taken";

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            }
        });

        await prisma.profile.create({
            data: {
                firstName,
                lastName,
                userId: newUser.id
            }
        });

        const otp = randomstring.generate({
            length: 6,
            charset: 'numeric'
        });

        const hashedOtp = await bcrypt.hash(otp, 10);

        await prisma.otp.create({
            data: {
                otp: hashedOtp,
                userId: newUser.id
            }
        });

        await sendOtp(email, otp);

        const privateKey = fs.readFileSync('privateKey.key');

        const verifyToken = jwt.sign({ email, type: "verify" }, privateKey, {
            expiresIn: '30 days',
            algorithm: 'RS256'
        });

        res.cookie("verifyToken", verifyToken, {
            httpOnly: true,
            maxAge: 2629743744,
            secure: true
        });


        res.status(200).json({status: true, message: "Signup successful"});
    } catch (err) {
        res.status(400).json({status: false, error: err});
    }
}


export const verify = async (req: Request, res: Response) => {
    const { otp } = req.params;
    try {
        const bearerToken = req.headers.authorization;
        if (!bearerToken) throw "Error on getting bearer token";

        const decoded: any = decodeToken(bearerToken);
        if (!decoded) throw "Error on decoding bearer token";

        if (decoded.type !== "verify") throw "Token type is invalid!";

        if (!otp) throw "OTP is missing";

        const user = await prisma.user.findUnique({
            where: {
                email: decoded.email
            },
            include: {
                Otp: true
            }
        });

        if (!user) throw "Invalid otp";
        if (!user.Otp) throw "Error: User does not have an otp yet";

        const isOtpCorrect = await bcrypt.compare(otp, user.Otp.otp);

        if (!isOtpCorrect) throw "Invalid OTP";

        //Check if OTP has expired
        if (isOneDayOld(user.Otp.createdAt)) {
            res.status(400).json({status: false, error: "OTP has expired", expired: true});
            return;
        } 

        //Verify the user
        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                verified: true,
                updatedAt: new Date()
            }
        });

        res.status(200).json({status: true, message: "User verified successfully"});
    } catch (err) {
        res.status(400).json({status: false, error: err, expired: false});
    }
}

export const resendOtp = async (req: Request, res: Response) => {
    try {
        const bearerToken = req.headers.authorization;
        if (!bearerToken) throw "Error on getting bearer token";

        const decoded: any = decodeToken(bearerToken);
        if (!decoded) throw "Error on decoding bearer token";

        if (decoded.type !== "verify") throw "Token type is invalid!";

        const user = await prisma.user.findUnique({
            where: {
                email: decoded.email
            },
            include: {
                Otp: true
            }
        });

        if (!user) throw "Invalid credentials";
        if (!user.Otp) throw "User is missing an OTP";

        if (!isOneMinuteOld(user.Otp.createdAt)) {
            res.status(200).json({status: true, message: "Please check your inbox or spam"});
            return;
        }

        //generate a new OTP
        const otp = randomstring.generate({
            length: 6,
            charset: 'numeric'
        });

        const hashedOtp = await bcrypt.hash(otp, 10);

        await prisma.otp.update({
            where: {
                userId: user.id
            },
            data: {
                otp: hashedOtp,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        //Send the new otp to the user's email
        await sendOtp(user.email, otp);

        res.status(200).json({status: true, message: "OTP sent successfully"});
    } catch (err) {
        res.status(400).json({status: false, error: err});
    }
}


export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.params;
    try {
        if (!email) throw "Email is missing";

        const user = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (!user) {
            res.status(200).json({status: true, message: "Password reset link sent successfully"});
            return;
        }
        
        //Don't send any email if the user is not verified
        if (!user.verified) {
            res.status(200).json({status: true, message: "Password reset link sent successfully"});
            return;
        }

        //!todo: Generate a jwt token with type forgotPassword and send it to the user's email
        const privateKey = fs.readFileSync('privateKey.key');

        const resetToken = jwt.sign({ email, type: "forgotPassword", createdAt: new Date() }, privateKey, {
            expiresIn: '1d',
            algorithm: 'RS256'
        });

        const link = `http://localhost:3000/reset?token=${resetToken}`;

        await sendPasswordResetLink(email, link);

        res.status(200).json({status: true, message: "Password reset link has been sent to your email"});
    } catch (err) {
        res.status(400).json({status: false, error: err});
    }
}


export const resetPassword = async (req: Request, res: Response) => {
    const { password, password2 } = req.body; 
    try {
        if (!password) throw "Password is required";
        if (!password2) throw "Please confirm your password";
        if (password !== password2) throw "Passwords do not match";

        const bearerToken = req.headers.authorization;
        if (!bearerToken) throw "Error on getting bearer token";

        const decoded: any = decodeToken(bearerToken);
        if (!decoded) throw "Error on decoding bearer token";

        if (decoded.type !== "forgotPassword") throw "Token type is invalid!";

        const user = await prisma.user.findUnique({
            where: {
                email: decoded.email
            }
        });

        if (!user) throw "Reset error";

        if (isOneDayOld(decoded.createdAt)) throw "Link has expired, please request a new link";

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password: hashedPassword,
                updatedAt: new Date()
            }
        });

        res.status(200).json({status: true, message: "Password reset successfully"});
    } catch (err) {
        res.status(400).json({status: false, error: err});
    }
}


export const resendPasswordResetLink = async (req: Request, res: Response) => {
    try {
        const bearerToken = req.headers.authorization;
        if (!bearerToken) throw "Error on getting bearer token";

        const decoded: any = decodeToken(bearerToken);
        if (!decoded) throw "Error on decoding bearer token";

        if (decoded.type !== "forgotPassword") throw "Token type is invalid!";

        const user = await prisma.user.findUnique({
            where: {
                email: decoded.email
            }
        });

        if (!user) throw "Invalid token";

        if (!isOneMinuteOld(decoded.createdAt)) {
            res.status(200).json({status: true, message: "Please check your inbox or spam"});
            return;
        }

        //generate a new token
        const privateKey = fs.readFileSync('privateKey.key');

        const resetToken = jwt.sign({ email: user.email, type: "forgotPassword", createdAt: new Date() }, privateKey, {
            expiresIn: '1d',
            algorithm: 'RS256'
        });

        const link = `http://localhost:3000/reset?token=${resetToken}`;

        await sendPasswordResetLink(user.email, link);

        res.status(200).json({status: true, message: "Reset link sent successfully"});
    } catch (err) {
        res.status(400).json({status: false, error: err});
    }
}