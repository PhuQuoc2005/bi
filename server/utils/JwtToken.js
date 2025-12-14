import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config({ path: '../config/config.env' });


export const generateToken = (userId, res) => {
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
    if (!JWT_SECRET_KEY) {
        throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign({ userId }, JWT_SECRET_KEY, {
        expiresIn: '7d',
    });

    res.cookie('jwt', token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,  // prevent XSS attacks: cross-site scripting
        sameSite: 'strict',  // CSRF attacks
        secure: process.env.NODE_ENV === 'development' ? false : true,
    })

    return token;
}