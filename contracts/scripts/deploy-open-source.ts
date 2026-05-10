/**
 * PlokyResolver Open Source Deployment Script
 * 
 * Deploys to Amoy testnet using public RPC (no Infura/Alchemy).
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-open-source.ts --network amoy
 * 
 * Environment:
 *   PRIVATE_KEY         - Deployer private key (with Amoy MATIC)
 *   AMOY_RPC            - Public Amoy RPC (default provided)
 *   POLYGONSCAN_API_KEY - Optional, for verification
 */

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying PlokyResolution with Open Source Stack...");
  console.log(`📋 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider!.getBalance(deployer.address))} MATIC`);

  // ─── Deploy PLKY Token ───
  console.log("\n🔑 Deploying PlokyToken...");
  const PlokyToken = await ethers.getContractFactory("PlokyToken");
  const plky = await PlokyToken.deploy(deployer.address);
  await plky.waitForDeployment();
  const plkyAddress = await plky.getAddress();
  console.log(`✅ PlokyToken deployed: ${plkyAddress}`);

  // ─── Deploy PlokyResolver ───
  console.log("\n⚖️ Deploying PlokyResolver...");
  const quorum = 2; // Need 2 of 3 resolvers
    const PlokyResolver = await ethers.getContractFactory("PlokyResolverLite");
    const resolver = await PlokyResolver.deploy(
        plkyAddress,
        deployer.address,
        quorum
    );
  await resolver.waitForDeployment();
  const resolverAddress = await resolver.getAddress();
  console.log(`✅ PlokyResolver deployed: ${resolverAddress}`);

  // ─── Setup Roles ───
  console.log("\n🔐 Configuring roles...");

  const AI_ORACLE_ROLE = await resolver.AI_ORACLE_ROLE();
  const RESOLVER_ROLE = await resolver.RESOLVER_ROLE();
  const ARBITER_ROLE = await resolver.ARBITER_ROLE();

  // Grant deployer all roles
  await (await resolver.grantRole(AI_ORACLE_ROLE, deployer.address)).wait();
  await (await resolver.grantRole(RESOLVER_ROLE, deployer.address)).wait();
  await (await resolver.grantRole(ARBITER_ROLE, deployer.address)).wait();
  console.log("✅ Roles granted to deployer");

  // ─── Mint initial PLKY ───
  console.log("\n💎 Minting initial PLKY...");
  await (await plky.mint(deployer.address, ethers.parseEther("100000"))).wait();
  console.log("✅ Minted 100,000 PLKY to deployer");

  // ─── Save deployment info ───
  const deploymentInfo = {
    network: (await deployer.provider!.getNetwork()).name,
    chainId: Number((await deployer.provider!.getNetwork()).chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      PlokyToken: plkyAddress,
      PlokyResolver: resolverAddress,
    },
    config: {
      quorum,
      aiOracle: deployer.address,
      initialMint: "100000",
    }
  };

  const deploymentPath = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const fileName = `deployment-${deploymentInfo.network}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentPath, fileName),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Also save as latest
  fs.writeFileSync(
    path.join(deploymentPath, "latest.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n📄 Deployment saved: deployments/${fileName}`);

  // ─── Print .env snippet ───
  console.log("\n" + "=".repeat(60));
  console.log("Add to your .env files:");
  console.log("=".repeat(60));
  console.log(`NEXT_PUBLIC_PLKY_ADDRESS=${plkyAddress}`);
  console.log(`NEXT_PUBLIC_RESOLVER_ADDRESS=${resolverAddress}`);
  console.log(`PLKY_RESOLVER_ADDRESS=${resolverAddress}`);
  console.log("=".repeat(60));

  // ─── Verify (optional) ───
  if (process.env.POLYGONSCAN_API_KEY) {
    console.log("\n🔍 Scheduling verification...");
    console.log(`npx hardhat verify --network amoy ${plkyAddress} ${deployer.address}`);
    console.log(`npx hardhat verify --network amoy ${resolverAddress} ${plkyAddress} ${deployer.address} ${quorum}`);
  }

  console.log("\n✅ Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
