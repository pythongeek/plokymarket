import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying PlokyToken ONLY (smaller, cheaper)...");
  console.log(`📋 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider!.getBalance(deployer.address))} MATIC`);

  const PlokyToken = await ethers.getContractFactory("PlokyToken");
  const plky = await PlokyToken.deploy(deployer.address);
  await plky.waitForDeployment();
  const plkyAddress = await plky.getAddress();
  console.log(`✅ PlokyToken deployed: ${plkyAddress}`);

  // Mint some PLKY
  await (await plky.mint(deployer.address, ethers.parseEther("100000"))).wait();
  console.log("✅ Minted 100,000 PLKY");

  // Save
  const info = {
    network: (await deployer.provider!.getNetwork()).name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    PlokyToken: plkyAddress
  };
  fs.mkdirSync(path.join(__dirname, "..", "deployments"), { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, "..", "deployments", "token-only.json"),
    JSON.stringify(info, null, 2)
  );

  console.log(`\nNEXT_PUBLIC_PLKY_ADDRESS=${plkyAddress}`);
}

main().catch(console.error);
