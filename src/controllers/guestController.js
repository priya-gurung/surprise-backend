import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookieOptions } from "../utils/cookieOptions.js";
import { prisma } from "../lib/prisma.js";
import { signGuestToken } from "../lib/jwt.js";

// POST /guest/register
export const guestRegister = async (req, res) => {
    try {
        const { code } = req.params;
        const { name, password } = req.body;

        const wishlist = await prisma.wishlist.findUnique({
            where: {
                code,
            },
        });

        if (!wishlist) {
            return res.status(404).json({
                message: "Wishlist not found",
            });
        }

        const normalizedName = name.trim().toLowerCase();

        const existingGuest = await prisma.guest.findUnique({
            where: {
                wishlistId_name: {
                    wishlistId: wishlist.id,
                    name: normalizedName,
                },
            },
        });

        if (existingGuest) {
            return res.status(409).json({
                message: "That name is already taken, try logging in",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const guest = await prisma.guest.create({
            data: {
                wishlistId: wishlist.id,
                name: normalizedName,
                displayName: name.trim(),
                passwordHash: hashedPassword,
            },
        });

        const token = jwt.sign(
            {
                guestId: guest.id,
                wishlistId: wishlist.id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.cookie("guest_token", token, cookieOptions);

        return res.status(201).json({
            message: "Guest registered successfully",
            guest: {
                id: guest.id,
                name: guest.displayName,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

// POST /guest/login
export const guestLogin = async (req, res) => {
    try {
        const { code } = req.params;
        const { name, password } = req.body;

        const wishlist = await prisma.wishlist.findUnique({
            where: {
                code,
            },
        });

        const normalizedName = name.trim().toLowerCase();

        if (!wishlist) {
            return res.status(401).json({
                message: "Incorrect name or password",
            });
        }

        const guest = await prisma.guest.findUnique({
            where: {
                wishlistId_name: {
                    wishlistId: wishlist.id,
                    name: normalizedName,
                },
            },
        });
        
        if (!guest) {
            return res.status(401).json({
                message: "No such user exists. Please register.",
            });
        }

        const validPassword = await bcrypt.compare(password, guest.passwordHash);

        if (!validPassword) {
            return res.status(401).json({
                message: "Incorrect name or password",
            });
        }

        const token = signGuestToken(guest, wishlist);

        res.cookie("guest_token", token, cookieOptions);

        return res.json({
            message: "Logged in successfully",
            guest: {
                id: guest.id,
                name: guest.displayName,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

// POST /guest/logout
export const guestLogout = (req, res) => {
    res.clearCookie("guest_token", cookieOptions);

    return res.json({
        message: "Logged out successfully",
    });
};