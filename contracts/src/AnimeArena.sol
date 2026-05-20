// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AnimeCharacter.sol";

contract AnimeArena {
    Character[] public characters;
    uint256 public battleCount;
    uint256 public nonce;

    struct BattleRecord {
        uint256 id;
        address player;
        uint256 playerCharId;
        uint256 opponentCharId;
        uint256 winnerId;
        uint256 loserId;
        uint256 timestamp;
    }

    struct PlayerStats {
        uint256 wins;
        uint256 losses;
    }

    struct PlayerLeaderboardEntry {
        address player;
        uint256 wins;
        uint256 losses;
    }

    BattleRecord[] public battleHistory;
    mapping(address => uint256[]) public playerBattleIds;
    mapping(address => PlayerStats) public players;
    address[] public allPlayers;
    mapping(address => bool) public isPlayer;

    event CharacterAdded(uint256 indexed id, string name, string anime, string imageCid, uint8 power);
    event BattleResult(
        uint256 indexed battleId,
        address indexed player,
        uint256 winnerId,
        uint256 loserId,
        string winnerName,
        string loserName,
        uint256 timestamp
    );

    constructor() {
        _seedCharacters();
    }

    function _seedCharacters() internal {
        _addCharacter("Goku", "Dragon Ball Z", "QmZ7c9K7GkDEmLxqkJkZvPQNgZmqPG1gqKxgEQbPJ3oQ1K", 95);
        _addCharacter("Vegeta", "Dragon Ball Z", "QmT5n2q3YTWHQMj2JsZGkhZqPWVxpQRpFmJqC5cxzBKLTq", 92);
        _addCharacter("Naruto", "Naruto", "QmPJY2Qx9KGQwCJQtbJwXQVQNyzZBzkKqJXYQXeHQHnGLK", 88);
        _addCharacter("Sasuke", "Naruto", "QmNrKwXxYKmNQJYYHTAZQBCo1ZRyEJFcCMQFRFqCJmCQVn", 87);
        _addCharacter("Luffy", "One Piece", "QmYQwKzjnLGhJqYXmZGqHyXFBsBPkGvCwGFxAuSqeEJRoF", 90);
        _addCharacter("Zoro", "One Piece", "QmPHzKJQmYJJHgkQZJQQYNfBWLfQaNmhjBVyKqKQBeqXuL", 89);
        _addCharacter("Levi", "Attack on Titan", "QmbWpQGqFQWZXwQXLrQzKJXTjxQhVgYyrYnPNXMxXtRqJc", 91);
        _addCharacter("Eren", "Attack on Titan", "QmXXYqQYKQbJTqZYQJYKHkQJZeBXmGjFJQJxCgWVnBQKbB", 85);
        _addCharacter("Gojo", "Jujutsu Kaisen", "QmYJGQjQZWBHxQJkQjYQJbQJFJqXQFKQJZQJkqQJbQJFJqX", 94);
        _addCharacter("Yuji", "Jujutsu Kaisen", "QmZJQKbQJGQJFQjQZQJYQJBQJFQKQjQZQJbQKqQJXQJFQJc", 78);
        _addCharacter("Tanjiro", "Demon Slayer", "QmXQJFQjQZQJYQKbQJgQJFQjQZQJbQJFQKqQJXQJFQJcQZ", 82);
        _addCharacter("Nezuko", "Demon Slayer", "QmYQJbQJFQKqQJXQJFQJcQZQJYQKbQJgQJFQjQZQJbQJF", 75);
        _addCharacter("Zenkichi", "Demon Slayer", "QmKbQJgQJFQjQZQJbQJFQKqQJXQJFQJcQZQJYQKbQJgQJF", 65);
        _addCharacter("Mikasa", "Attack on Titan", "QmQJFQjQZQJbQJFQKqQJXQJFQJcQZQJYQKbQJgQJFQjQZ", 86);
        _addCharacter("Itachi", "Naruto", "QmQJbQJFQKqQJXQJFQJcQZQJYQKbQJgQJFQjQZQJbQJFQKq", 93);
        _addCharacter("Kakashi", "Naruto", "QmQJXQJFQJcQZQJYQKbQJgQJFQjQZQJbQJFQKqQJXQJFQJc", 84);
        _addCharacter("Ichigo", "Bleach", "QmQJYQKbQJgQJFQjQZQJbQJFQKqQJXQJFQJcQZQJYQKbQJg", 88);
        _addCharacter("Rukia", "Bleach", "QmQJFQjQZQJbQJFQKqQJXQJFQJcQZQJYQKbQJgQJFQjQZQJb", 76);
        _addCharacter("Edward", "Fullmetal Alchemist", "QmQJFQKqQJXQJFQJcQZQJYQKbQJgQJFQjQZQJbQJFQKqQJX", 83);
        _addCharacter("Light", "Death Note", "QmQJFQJcQZQJYQKbQJgQJFQjQZQJbQJFQKqQJXQJFQJcQZQJ", 70);
        _addCharacter("Saitama", "One Punch Man", "QmQJYQKbQJgQJFQjQZQJbQJFQKqQJXQJFQJcQZQJYQKbQJg", 97);
        _addCharacter("Genos", "One Punch Man", "QmQJFQjQZQJbQJFQKqQJXQJFQJcQZQJYQKbQJgQJFQjQZQJb", 82);
        _addCharacter("Mob", "Mob Psycho 100", "QmQJFQKqQJXQJFQJcQZQJYQKbQJgQJFQjQZQJbQJFQKqQJX", 85);
        _addCharacter("Shinra", "Fire Force", "QmQJFQJcQZQJYQKbQJgQJFQjQZQJbQJFQKqQJXQJFQJcQZQJ", 80);
        _addCharacter("Deku", "My Hero Academia", "QmQJYQKbQJgQJFQjQZQJbQJFQKqQJXQJFQJcQZQJYQKbQJg", 86);
        _addCharacter("Bakugo", "My Hero Academia", "QmQJFQjQZQJbQJFQKqQJXQJFQJcQZQJYQKbQJgQJFQjQZQJb", 85);
        _addCharacter("Todoroki", "My Hero Academia", "QmQJFQKqQJXQJFQJcQZQJYQKbQJgQJFQjQZQJbQJFQKqQJX", 84);
        _addCharacter("Inuyasha", "Inuyasha", "QmQJFQJcQZQJYQKbQJgQJFQjQZQJbQJFQKqQJXQJFQJcQZQJ", 81);
        _addCharacter("Spike", "Cowboy Bebop", "QmQJYQKbQJgQJFQjQZQJbQJFQKqQJXQJFQJcQZQJYQKbQJg", 79);
        _addCharacter("Vash", "Trigun", "QmQJFQjQZQJbQJFQKqQJXQJFQJcQZQJYQKbQJgQJFQjQZQJb", 83);
    }

    function _addCharacter(string memory name, string memory anime, string memory imageCid, uint8 power) internal {
        uint256 id = characters.length;
        characters.push(Character(id, name, anime, imageCid, power, 0, 0));
        emit CharacterAdded(id, name, anime, imageCid, power);
    }

    function getCharacterCount() external view returns (uint256) {
        return characters.length;
    }

    function getCharacter(uint256 id) external view returns (Character memory) {
        require(id < characters.length, "Character does not exist");
        return characters[id];
    }

    function getAllCharacters() external view returns (Character[] memory) {
        return characters;
    }

    function battle(uint256 playerCharacterId) external returns (uint256 winnerId, uint256 loserId) {
        require(playerCharacterId < characters.length, "Invalid character");
        require(characters.length >= 2, "Not enough characters");

        if (!isPlayer[msg.sender]) {
            allPlayers.push(msg.sender);
            isPlayer[msg.sender] = true;
        }

        uint256 opponentId = _randomOpponent(playerCharacterId);

        Character storage player = characters[playerCharacterId];
        Character storage opponent = characters[opponentId];

        (uint256 wId, uint256 lId) = _resolveBattle(playerCharacterId, opponentId);

        if (wId == playerCharacterId) {
            player.wins++;
            opponent.losses++;
            players[msg.sender].wins++;
        } else {
            opponent.wins++;
            player.losses++;
            players[msg.sender].losses++;
        }

        battleCount++;
        battleHistory.push(BattleRecord(battleCount, msg.sender, playerCharacterId, opponentId, wId, lId, block.timestamp));
        playerBattleIds[msg.sender].push(battleHistory.length - 1);

        emit BattleResult(battleCount, msg.sender, wId, lId, characters[wId].name, characters[lId].name, block.timestamp);

        return (wId, lId);
    }

    function getPlayerBattles(address player, uint256 offset, uint256 limit) external view returns (BattleRecord[] memory) {
        uint256[] storage ids = playerBattleIds[player];
        uint256 total = ids.length;
        if (offset >= total) return new BattleRecord[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        uint256 count = end - offset;
        BattleRecord[] memory result = new BattleRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = battleHistory[ids[offset + i]];
        }
        return result;
    }

    function getPlayerBattleCount(address player) external view returns (uint256) {
        return playerBattleIds[player].length;
    }

    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return players[player];
    }

    function getAllPlayers() external view returns (PlayerLeaderboardEntry[] memory) {
        uint256 count = allPlayers.length;
        PlayerLeaderboardEntry[] memory entries = new PlayerLeaderboardEntry[](count);
        for (uint256 i = 0; i < count; i++) {
            address p = allPlayers[i];
            entries[i] = PlayerLeaderboardEntry(p, players[p].wins, players[p].losses);
        }
        return entries;
    }

    function _randomOpponent(uint256 playerId) internal returns (uint256) {
        nonce++;
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, nonce)));
        uint256 opponentId = rand % characters.length;
        if (opponentId == playerId) {
            opponentId = (opponentId + 1) % characters.length;
        }
        return opponentId;
    }

    function _resolveBattle(uint256 a, uint256 b) internal view returns (uint256 winner, uint256 loser) {
        Character storage ca = characters[a];
        Character storage cb = characters[b];
        uint256 roll = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, a, b))) % 100;
        uint256 cutoff = (uint256(ca.power) * 100) / (uint256(ca.power) + uint256(cb.power));
        if (roll < cutoff) {
            return (a, b);
        } else {
            return (b, a);
        }
    }
}
