import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer, r1, r2, r3, r4, r5] = await ethers.getSigners();
  console.log("ডিপ্লয় করা হছে:", deployer.address);

  // Deploy PLKY Token
  console.log("\n1. PLKY Token ডিপ্লয় করা হছে...");
  const PLKYToken = await ethers.getContractFactory("PlokyToken");
  const plkyToken = await PLKYToken.deploy(deployer.address);
  await plkyToken.waitForDeployment();
  const plkyAddress = await plkyToken.getAddress();
  console.log("   PLKY Token:", plkyAddress);

  // Deploy PlokyResolver
  console.log("\n2. PlokyResolver ডিপ্লয় করা হছে...");
  const PlokyResolver = await ethers.getContractFactory("PlokyResolver");
  
  // Initial resolvers: 5 addresses, quorum = 3 (3-of-5 multi-sig)
  const initialResolvers = [r1.address, r2.address, r3.address, r4.address, r5.address];
  const quorum = 3;
  
  const resolver = await PlokyResolver.deploy(plkyAddress, deployer.address, quorum);
  await resolver.waitForDeployment();
  const resolverAddress = await resolver.getAddress();
  console.log("   PlokyResolver:", resolverAddress);

  // Grant AI_ORACLE_ROLE to deployer
  console.log("\n3. AI Oracle Role সেট করা হছে...");
  await resolver.grantRole(await resolver.AI_ORACLE_ROLE(), deployer.address);
  console.log("   সম্পূর্ণ!");

  // Mint initial PLKY tokens to resolvers for staking
  console.log("\n4. রিজলভারদের জন্য PLKY টোকেন মিন্ট করা হছে...");
  const stakeAmount = ethers.parseEther("5000"); // 5000 PLKY per resolver
  for (const resolverAddr of initialResolvers) {
    await plkyToken.mint(resolverAddr, stakeAmount);
  }
  console.log("   প্রতি রিজলভারের জন্য 5000 PLKY মিন্ট হয়েছে");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    timestamp: new Date().toISOString(),
    contracts: {
      PLKYToken: plkyAddress,
      PlokyResolver: resolverAddress,
    },
    initialResolvers,
    quorum,
    deployer: deployer.address,
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", `${deploymentInfo.network}.json`);
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\nডিপ্লয়মেন্ট তথ্য:", deploymentPath);

  // Print verification commands
  console.log("\nনির্দেশিকা:");
  console.log(`npx hardhat verify --network ${deploymentInfo.network} ${plkyAddress} ${deployer.address}`);
  console.log(`npx hardhat verify --network ${deploymentInfo.network} ${resolverAddress} ${plkyAddress} ${deployer.address} ${quorum}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
