const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying X-Ray Protocol Smart Contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Check account balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy XRayIdentity contract
  const XRayIdentity = await ethers.getContractFactory("XRayIdentity");
  const xRayIdentity = await XRayIdentity.deploy();

  await xRayIdentity.waitForDeployment();
  const xRayIdentityAddress = await xRayIdentity.getAddress();
  
  console.log("XRayIdentity deployed to:", xRayIdentityAddress);
  console.log("Transaction hash:", xRayIdentity.deploymentTransaction().hash);

  // Save deployment information
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      XRayIdentity: {
        address: xRayIdentityAddress,
        deploymentHash: xRayIdentity.deploymentTransaction().hash
      }
    },
    deployedAt: new Date().toISOString()
  };

  // Write deployment info to file
  const fs = require("fs");
  const deploymentDir = "../deployments";
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = `${deploymentDir}/${networkName}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`Deployment information saved to: ${deploymentFile}`);

  // Verify contract deployment
  console.log("\nVerifying contract deployment...");
  const owner = await xRayIdentity.owner();
  console.log("Contract owner:", owner);
  
  const totalIdentities = await xRayIdentity.totalIdentities();
  console.log("Initial total identities:", totalIdentities.toString());

  console.log("\nDeployment completed successfully!");
  console.log("You can now interact with the contract at:", xRayIdentityAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
