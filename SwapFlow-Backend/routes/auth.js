const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();
const prisma = new PrismaClient();

router.get('/status', (req, res) => {
    res.json({
        message: 'Hello, world!'
    });
});

// Helper function to generate API key
function generateApiKey() {
    return 'ak_' + Math.random().toString(36).substr(2, 9);
}

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        // console.log(email + password);
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'User already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user and API key in a transaction
        const result = await prisma.$transaction(async (prisma) => {
            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                }
            });

            // Create API key
            const apiKey = await prisma.apiKey.create({
                data: {
                    key: generateApiKey(),
                    userId: user.id
                }
            });

            return { user, apiKey };
        });

        res.json({
            status: 'success',
            data: {
                user: {
                    id: result.user.id,
                    email: result.user.email
                },
                apiKey: result.apiKey.key
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating user'
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                apiKeys: {
                    where: { active: true },
                    take: 1
                }
            }
        });

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email
                },
                apiKey: user.apiKeys[0]?.key
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error during login'
        });
    }
});

// Add a logout route
router.post('/logout', (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    res.json({
        status: 'success',
        message: 'Logged out successfully'
    });
});

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        // Get token from cookie
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Not authenticated'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                apiKeys: {
                    where: { active: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    apiKeys: user.apiKeys.map(key => ({
                        key: key.key,
                        createdAt: key.createdAt,
                        lastUsed: key.lastUsed
                    }))
                }
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching profile'
        });
    }
});

// Add wallet address
router.post('/wallet', authenticateToken, async (req, res) => {
    try {
        const { tokenName, address } = req.body;

        const wallet = await prisma.walletAddress.upsert({
            where: {
                userId_tokenName: {
                    userId: req.user.id,
                    tokenName: tokenName.toUpperCase()
                }
            },
            update: {
                address
            },
            create: {
                userId: req.user.id,
                tokenName: tokenName.toUpperCase(),
                address
            }
        });

        res.json({
            status: 'success',
            data: { wallet }
        });
    } catch (error) {
        console.error('Wallet creation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error managing wallet address'
        });
    }
});

// Get user's wallets
router.get('/wallets', authenticateToken, async (req, res) => {
    try {
        const wallets = await prisma.walletAddress.findMany({
            where: {
                userId: req.user.id
            }
        });

        res.json({
            status: 'success',
            data: { wallets }
        });
    } catch (error) {
        console.error('Wallet fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching wallet addresses'
        });
    }
});

// Get all transactions for a user
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await prisma.initialTransaction.findMany({
            where: {
                userId: req.user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                completedTransaction: true
            }
        });

        res.json({
            status: 'success',
            data: { transactions }
        });
    } catch (error) {
        console.error('Transaction fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching transactions'
        });
    }
});

// Get transaction details by ID
router.get('/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const transaction = await prisma.initialTransaction.findUnique({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: {
                completedTransaction: true
            }
        });

        if (!transaction) {
            return res.status(404).json({
                status: 'error',
                message: 'Transaction not found'
            });
        }

        res.json({
            status: 'success',
            data: { transaction }
        });
    } catch (error) {
        console.error('Transaction detail error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching transaction details'
        });
    }
});

// Update transaction details
router.patch('/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const { status, notes } = req.body;

        const transaction = await prisma.initialTransaction.update({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            data: {
                status,
                notes
            },
            include: {
                completedTransaction: true
            }
        });

        res.json({
            status: 'success',
            data: { transaction }
        });
    } catch (error) {
        console.error('Transaction update error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating transaction'
        });
    }
});

// Get transaction statistics
router.get('/transaction-stats', authenticateToken, async (req, res) => {
    try {
        const [totalCount, completedCount, totalVolume] = await Promise.all([
            // Total transactions
            prisma.initialTransaction.count({
                where: { userId: req.user.id }
            }),
            // Completed transactions
            prisma.completedTransaction.count({
                where: { 
                    initialTransaction: {
                        userId: req.user.id
                    }
                }
            }),
            // Total volume (for completed transactions)
            prisma.completedTransaction.aggregate({
                where: {
                    initialTransaction: {
                        userId: req.user.id
                    }
                },
                _sum: {
                    amount: true
                }
            })
        ]);

        res.json({
            status: 'success',
            data: {
                totalTransactions: totalCount,
                completedTransactions: completedCount,
                successRate: totalCount ? (completedCount / totalCount * 100).toFixed(2) : 0,
                totalVolume: totalVolume._sum.amount || 0
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching transaction statistics'
        });
    }
});

// Delete transaction (soft delete)
router.delete('/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const transaction = await prisma.initialTransaction.update({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            data: {
                deleted: true,
                deletedAt: new Date()
            }
        });

        res.json({
            status: 'success',
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        console.error('Transaction deletion error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error deleting transaction'
        });
    }
});

// Get recent activity
router.get('/recent-activity', authenticateToken, async (req, res) => {
    try {
        const recentTransactions = await prisma.initialTransaction.findMany({
            where: {
                userId: req.user.id,
                deleted: false
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10,
            include: {
                completedTransaction: true
            }
        });

        res.json({
            status: 'success',
            data: { recentTransactions }
        });
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching recent activity'
        });
    }
});

// Search transactions
router.get('/search-transactions', authenticateToken, async (req, res) => {
    try {
        const { query, status, startDate, endDate } = req.query;

        const where = {
            userId: req.user.id,
            deleted: false,
            ...(status && { status }),
            ...(startDate && endDate && {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            }),
            ...(query && {
                OR: [
                    { customerAddress: { contains: query } },
                    { inputMint: { contains: query } },
                    { outputMint: { contains: query } }
                ]
            })
        };

        const transactions = await prisma.initialTransaction.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                completedTransaction: true
            }
        });

        res.json({
            status: 'success',
            data: { transactions }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error searching transactions'
        });
    }
});

module.exports = router; 