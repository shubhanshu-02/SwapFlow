const express = require('express');
const axios = require('axios');
const router = express.Router();
const TOKENS = require('../config/tokens');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const solanaWeb3 = require('@solana/web3.js');

const prisma = new PrismaClient();

router.get('/status', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/v1/quote
router.get('/quote', async (req, res, next) => {
//   console.log('Quote Request:', req.query);
  try {
    const { inputMint, outputMint, amount, slippageBps = '50', swapMode = 'ExactIn' } = req.query;

    // Debug logging
    // console.log('Available tokens:', TOKENS);
    // console.log('Requested tokens:', {
    //   inputMint,
    //   outputMint,
    //   inputMintAddress: TOKENS[inputMint],
    //   outputMintAddress: TOKENS[outputMint]
    // });

    // Validate required parameters
    if (!inputMint || !outputMint || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters'
      });
    }

    // Validate tokens exist in our config
    if (!TOKENS[inputMint] || !TOKENS[outputMint]) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid token mint address',
        supportedTokens: Object.keys(TOKENS),
        requestedTokens: { inputMint, outputMint }
      });
    }

    const config = {
      method: 'get',
      url: 'https://api.jup.ag/swap/v1/quote',
      headers: {
        'Accept': 'application/json'
      },
      params: {
        inputMint: TOKENS[inputMint],
        outputMint: TOKENS[outputMint],
        amount,
        slippageBps,
        swapMode
      }
    };

    const response = await axios.request(config);
    const data = response.data;

    // Get token name from mint address
    const getTokenName = (mintAddress) => {
      return Object.entries(TOKENS).find(([name, addr]) => addr === mintAddress)?.[0] || mintAddress;
    };

    // Simplify the response
    const simplifiedResponse = {
      status: 'success',
      data: {
        inputToken: inputMint,
        inputValue: data.inAmount,
        outputToken: outputMint,
        outputValue: data.outAmount,
        route: data.routePlan.map(route => route.swapInfo.label).join(' → '),
        feeMint: getTokenName(data.routePlan[0].swapInfo.feeMint),
        feeAmount: data.routePlan.reduce((total, route) => 
          total + Number(route.swapInfo.feeAmount), 0).toString()
      }
    };

    res.json(simplifiedResponse);

  } catch (error) {
    console.error('Jupiter API Error:', error.response?.data || error.message);
    next(error);
  }
});

// Middleware to verify API key
async function verifyApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            status: 'error',
            message: 'API key is required'
        });
    }

    try {
        const keyData = await prisma.apiKey.findUnique({
            where: { key: apiKey },
            include: { user: true }
        });

        if (!keyData || !keyData.active) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid or inactive API key'
            });
        }

        // Update last used timestamp
        await prisma.apiKey.update({
            where: { id: keyData.id },
            data: { lastUsed: new Date() }
        });

        // Attach user and API key to request
        req.user = keyData.user;
        req.apiKey = keyData.key;
        next();
    } catch (error) {
        console.error('API key verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error verifying API key'
        });
    }
}

// POST /api/v1/swap
router.post('/swap', verifyApiKey, async (req, res) => {
    try {
        const { inputMint, outputMint, amount, slippageBps = '50', customerPublicKey } = req.body;
        
        // console.log('Swap Request Received:', {
        //     inputMint,
        //     outputMint,
        //     amount,
        //     slippageBps,
        //     customerPublicKey
        // });

        // Get merchant's wallet address from DB
        const merchantWallet = await prisma.walletAddress.findUnique({
            where: {
                userId_tokenName: {
                    userId: req.user.id,
                    tokenName: outputMint
                }
            }
        });

        // console.log('Merchant Wallet Found:', merchantWallet);

        if (!merchantWallet) {
            return res.status(400).json({
                status: 'error',
                message: `No merchant wallet found for ${outputMint}`
            });
        }

        // Get quote first
        // console.log('Requesting Quote from Jupiter...');
        const quoteResponse = await axios.get('https://quote-api.jup.ag/v6/quote', {
            params: {
                inputMint: TOKENS[inputMint],
                outputMint: TOKENS[outputMint],
                amount,
                slippageBps,
                feeBps: 0
            }
        });

        // console.log('Quote Response:', quoteResponse.data);

        // Prepare swap request
        const swapRequestData = {
            quoteResponse: quoteResponse.data,
            userPublicKey: customerPublicKey,
            destinationTokenAccount: merchantWallet.address,
            dynamicComputeUnitLimit: true,
            prioritizationFeeLamports: {
                priorityLevelWithMaxLamports: {
                    maxLamports: 1000000,
                    priorityLevel: "veryHigh"
                }
            },
            wrapUnwrapSOL: true,
            asLegacyTransaction: false
        };

        // console.log('Sending Swap Request to Jupiter:', JSON.stringify(swapRequestData, null, 2));

        // Get swap transaction
        const swapResponse = await axios.post(
            'https://quote-api.jup.ag/v6/swap',
            swapRequestData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        // console.log('Swap Response from Jupiter:', swapResponse.data);

        // Create initial transaction record
        const initialTx = await prisma.initialTransaction.create({
            data: {
                userId: req.user.id,
                inputMint,
                outputMint,
                amount,
                slippageBps,
                apiKeyUsed: req.apiKey,
                customerAddress: customerPublicKey
            }
        });

        // console.log('Initial Transaction Created:', initialTx);

        const responseData = {
            status: 'success',
            data: {
                swapTransaction: swapResponse.data.swapTransaction,
                initialTxId: initialTx.id,
                lastValidBlockHeight: swapResponse.data.lastValidBlockHeight,
                computeUnitLimit: swapResponse.data.computeUnitLimit,
                
                // Additional details for frontend display
                customerWallet: customerPublicKey,
                merchantWallet: merchantWallet.address,
                inputAmount: amount,
                inputMint: inputMint,
                outputAmount: quoteResponse.data.outAmount,
                outputMint: outputMint,
                slippageBps: slippageBps,
                route: quoteResponse.data.routePlan?.map(route => route.swapInfo.label).join(' → ') || 'Direct swap',
                fee: quoteResponse.data.routePlan?.[0]?.swapInfo?.feeAmount || '0',
                feeMint: inputMint,
                priceImpact: quoteResponse.data.priceImpactPct,
                expectedOutput: quoteResponse.data.outAmount
            }
        };

        // console.log('Sending Response to Frontend:', JSON.stringify(responseData, null, 2));
        res.json(responseData);

    } catch (error) {
        console.error('Swap Error:', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });
        res.status(500).json({
            status: 'error',
            message: 'Error processing swap request',
            details: error.response?.data || error.message
        });
    }
});

// Confirmation route for completed transactions
router.post('/confirm-transaction', verifyApiKey, async (req, res) => {
    try {
        const { initialTxId, signature } = req.body;

        // Verify the initial transaction belongs to the user
        const initialTx = await prisma.initialTransaction.findUnique({
            where: { 
                id: initialTxId,
                userId: req.user.id
            }
        });

        if (!initialTx) {
            return res.status(404).json({
                status: 'error',
                message: 'Initial transaction not found'
            });
        }

        // Connect to Solana
        const connection = new solanaWeb3.Connection(
            'https://api.mainnet-beta.solana.com',
            'confirmed'
        );

        // Verify transaction
        const confirmation = await connection.confirmTransaction(
            { signature },
            "finalized"
        );

        let status = 'success';
        if (confirmation.value.err) {
            status = 'failed';
            console.error(`Transaction failed: https://solscan.io/tx/${signature}/`);
        } else {
            // console.log(`Transaction successful: https://solscan.io/tx/${signature}/`);
        }

        // Create completed transaction record
        const completedTx = await prisma.completedTransaction.create({
            data: {
                initialTxId,
                userId: req.user.id,
                transactionHash: signature,
                status: status
            }
        });

        res.json({
            status: 'success',
            data: {
                completedTransaction: completedTx,
                solanaStatus: status,
                explorerUrl: `https://solscan.io/tx/${signature}/`
            }
        });

    } catch (error) {
        console.error('Transaction confirmation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error confirming transaction',
            details: error.message
        });
    }
});

// Get user's transaction history
router.get('/transactions', verifyApiKey, async (req, res) => {
    try {
        const transactions = await prisma.initialTransaction.findMany({
            where: { userId: req.user.id },
            include: { completedTx: true },
            orderBy: { requestedAt: 'desc' }
        });

        res.json({
            status: 'success',
            data: {
                transactions: transactions.map(tx => ({
                    id: tx.id,
                    inputMint: tx.inputMint,
                    outputMint: tx.outputMint,
                    amount: tx.amount,
                    requestedAt: tx.requestedAt,
                    status: tx.completedTx ? 'completed' : 'pending',
                    transactionHash: tx.completedTx?.transactionHash,
                    completedAt: tx.completedTx?.completedAt
                }))
            }
        });

    } catch (error) {
        console.error('Transaction history error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching transaction history'
        });
    }
});

module.exports = router; 