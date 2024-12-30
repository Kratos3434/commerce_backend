import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { decodeToken } from './authenticator';

const prisma = new PrismaClient();

export const addItem = async (req: Request, res: Response) => {
    const { name, price, description, stocks, conditionId, categoryId, isFreeShipping } = req.body;
    try {
        if (!req.files) throw "Failed to upload photos";
        if (req.files.length === 0) throw "Please upload at least 1 photo of your item";

        const files: any = req.files;

        //const photoUrls = req.files.map((file) => file.location);
        //array of photo urls from S3
        const photoUrls = files.map((file: any) => file.location);

        //Check if user is valid
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

        if (!user) throw "Invalid token";
        if (!user.Profile) throw "Invalid token";

        //Validate fields
        if (!name) throw "Name is required";
        if (!price) throw "Price is required";
        if (isNaN(price)) throw "Price must be a valid number";
        if (!stocks) throw "Stocks is required";
        if (isNaN(stocks)) throw "Stocks must be valid number";
        if (+stocks <= 0) throw "Stocks must be greater than 0";
        if (!conditionId) throw "Condition Id is required";
        if (isNaN(conditionId)) throw "Condition id must be a valid number";
        if (!categoryId) throw "Category id is required";
        if (isNaN(categoryId)) throw "Category id must be a valid number";

        //Check if condition and category exists
        const condition = await prisma.condition.findUnique({
            where: {
                id: +conditionId
            }
        });

        if (!condition) throw "Invalid condition";
        
        const category = await prisma.category.findUnique({
            where: {
                id: +categoryId
            }
        });

        if (!category) throw "Invalid category";

        //Create a new item
        await prisma.item.create({
            data: {
                name,
                price: +price,
                description,
                stocks: +stocks,
                photos: photoUrls,
                isFreeShipping: isFreeShipping ? true : false,
                conditionId: +conditionId,
                categoryId: +categoryId,
                sellerId: user.Profile.id
            }
        });

        res.status(200).json({ status: true, message: "New item created" });
    } catch (err) {
        res.status(400).json({ status: false, error: err });
    }
}