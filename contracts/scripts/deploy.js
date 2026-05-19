const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "RITUAL");

  const AnimeArena = await hre.ethers.getContractFactory("AnimeArena");
  const arena = await AnimeArena.deploy();
  await arena.waitForDeployment();

  const address = await arena.getAddress();
  console.log("AnimeArena deployed to:", address);

  const count = await arena.getCharacterCount();
  console.log("Characters seeded:", count.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
