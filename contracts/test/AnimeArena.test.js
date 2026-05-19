const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AnimeArena", function () {
  let arena, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const AnimeArena = await ethers.getContractFactory("AnimeArena");
    arena = await AnimeArena.deploy();
    await arena.waitForDeployment();
  });

  it("should deploy with 30 characters", async function () {
    expect(await arena.getCharacterCount()).to.equal(30);
  });

  it("should return correct character data", async function () {
    const char = await arena.getCharacter(0);
    expect(char.name).to.equal("Goku");
    expect(char.anime).to.equal("Dragon Ball Z");
    expect(char.power).to.equal(95);
  });

  it("should revert for invalid character id", async function () {
    await expect(arena.getCharacter(99)).to.be.revertedWith("Character does not exist");
  });

  it("should allow a battle and emit event", async function () {
    const tx = await arena.connect(addr1).battle(0);
    const receipt = await tx.wait();

    const log = receipt.logs.find(
      (l) => l.topics[0] === ethers.id("BattleResult(uint256,uint256,uint256,string,string,uint256)")
    );
    expect(log).to.not.be.undefined;
    expect(await arena.battleCount()).to.equal(1);
  });

  it("should update win/loss counters correctly", async function () {
    for (let i = 0; i < 10; i++) {
      await arena.connect(addr1).battle(0);
    }
    const charAfter = await arena.getCharacter(0);
    expect(charAfter.wins + charAfter.losses).to.equal(10);
  });

  it("should return all characters", async function () {
    const all = await arena.getAllCharacters();
    expect(all.length).to.equal(30);
  });

  it("should revert when character does not exist", async function () {
    await expect(arena.battle(99)).to.be.revertedWith("Invalid character");
  });
});
