-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitialTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inputMint" TEXT NOT NULL,
    "outputMint" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "slippageBps" TEXT NOT NULL,
    "apiKeyUsed" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InitialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletedTransaction" (
    "id" TEXT NOT NULL,
    "initialTxId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletedTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "WalletAddress_userId_idx" ON "WalletAddress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletAddress_userId_tokenName_key" ON "WalletAddress"("userId", "tokenName");

-- CreateIndex
CREATE INDEX "InitialTransaction_userId_idx" ON "InitialTransaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompletedTransaction_initialTxId_key" ON "CompletedTransaction"("initialTxId");

-- CreateIndex
CREATE INDEX "CompletedTransaction_userId_idx" ON "CompletedTransaction"("userId");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAddress" ADD CONSTRAINT "WalletAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitialTransaction" ADD CONSTRAINT "InitialTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedTransaction" ADD CONSTRAINT "CompletedTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedTransaction" ADD CONSTRAINT "CompletedTransaction_initialTxId_fkey" FOREIGN KEY ("initialTxId") REFERENCES "InitialTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
