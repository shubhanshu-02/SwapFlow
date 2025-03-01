const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function authenticateToken(req, res, next) {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Not authenticated'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        next();
    } catch (error) {
        return res.status(403).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
}

module.exports = { authenticateToken };