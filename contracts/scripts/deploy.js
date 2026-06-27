const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "RITUAL");

  const AnimeArena = await hre.ethers.getContractFactory("AnimeArena");
  const arena = await AnimeArena.deploy();
  await arena.waitForDeployment();

  const address = await arena.getAddress();
  const txHash = arena.deploymentTransaction().hash;
  console.log("AnimeArena deployed to:", address);
  console.log("Deploy tx hash:", txHash);

  const count = await arena.getCharacterCount();
  console.log("Characters seeded:", count.toString());

  const out = { address, txHash, deployer: deployer.address, chainId: 1979, timestamp: new Date().toISOString() };
  fs.writeFileSync(path.join(__dirname, "..", "deployment.json"), JSON.stringify(out, null, 2));
  console.log("Deployment info saved to contracts/deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
