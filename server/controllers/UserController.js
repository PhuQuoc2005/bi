import { generateToken } from "../utils/JwtToken.js";
import database from '../database/db.js';
import bcrypt from 'bcryptjs';

export const signup = async (req, res) => {
    const { full_name, phone_number, password, role_id, owner_id } = req.body;

    try {
        if (!full_name || !phone_number || !password || !role_id){
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6){
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // check if phone_number valid: regex   
        const regex = /^\d{10}$/;  
        if (!regex.test(phone_number)){
            return res.status(400).json({ message: 'Invalid phone number format' });
        };

        // Check duplicate phone number
        const checkUser = await database.query(
            'SELECT id FROM "users" WHERE phone_number = $1',
            [phone_number]
        );

        if (checkUser.rows.length > 0) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }

        console.log('Creating user with data:', { full_name, phone_number, role_id, owner_id });
        // create hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // insert new user
        const newUser = await database.query(
            `
                INSERT INTO "users"
                (full_name, phone_number, password, role_id, owner_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, full_name, phone_number, role_id, owner_id, created_at
            `,
            [full_name, phone_number, hashedPassword, role_id, owner_id || null]
        );

        if (newUser){

            generateToken(newUser.id, res);

            return res.status(201).json({
                message: 'User created successfully',
                data: newUser.rows[0]
            });

        } else {
            return res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (error) {
        console.log('Error in signup controller:', error);
        return res.status(500).json({ message: 'Internal Server error' });
    }
}

export const login = async (req, res) => {
    const { phone_number, password } = req.body;
    
    try {
        // Validate input
        if (!phone_number || !password){
            return res.status(400).json({ message: 'Phone number and password are required' });
        }

        // Validate phone format
        const regex = /^\d{10}$/;
        if (!regex.test(phone_number)) {
            return res.status(400).json({ message: 'Invalid phone number format' });
        }

        // find user
        const result = await database.query(
            `
                SELECT id, full_name, phone_number, password, role_id, is_active
                FROM "users"
                WHERE phone_number = $1
            `,
            [phone_number]
        );

        // Not found
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid phone number or password' });
        }

        const user = result.rows[0];

        // Check active
        if (!user.is_active) {
            return res.status(403).json({ message: 'Account is inactive' });
        }


        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid phone number or password' });

        generateToken(user.id, res);

        res.status(200).json({ 
            id: user.id,
            full_name: user.full_name,
            phone_number: user.phone_number,
            role_id: user.role_id
        });
    } catch (error) {
        console.error('Error in login controller:', error);
        res.status(500).json({ message: 'Internal Server error' });
    }
};

export const logout = (_, res) => {
    res.cookie('jwt', '', { matxAge: 0 });
    res.status(200).json({ message: 'Logged out successfully' });
};