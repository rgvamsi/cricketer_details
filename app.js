const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Started at http://localhost:3000")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertPlyerDetailsDbToResponse = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDetailsDbToResponse = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const convertPlayerMatchScoreDbToResponse = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const playersQuery = `
    SELECT * FROM player_details;
    `;
  const dbResponse = await db.all(playersQuery);
  response.send(
    dbResponse.map((eachPlayer) => convertPlyerDetailsDbToResponse(eachPlayer))
  );
});
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
    SELECT * FROM player_details WHERE player_id=${playerId};
    `;
  const player = await db.get(playerQuery);
  response.send(player);
});
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
    UPDATE 
        player_details 
    SET 
        player_name="${playerName}" 
    WHERE 
        player_id=${playerId};
    `;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
    SELECT * FROM match_details WHERE match_id=${matchId};`;
  const match = await db.get(matchQuery);
  response.send(match);
});
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const matchesQuery = `
  SELECT * 
  FROM 
  player_match_score NATURAL JOIN match_details 
  WHERE 
  player_id=${playerId};
  `;
  const dbResponse = await db.all(matchesQuery);
  response.send(
    dbResponse.map((eachMatch) => convertMatchDetailsDbToResponse(eachMatch))
  );
});
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const matchesQuery = `
    SELECT * FROM player_match_score NATURAL JOIN player_details
    WHERE match_id=${matchId};
    `;
  const player = await db.all(matchesQuery);
  response.send(
    player.map((eachPlayer) => convertPlyerDetailsDbToResponse(eachPlayer))
  );
});
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const matchPlayersQuery = `
    SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score)AS totalScore,
    SUM(fours)AS totalFours,
    SUM(sixes)AS totalSixes
    FROM player_match_score NATURAL JOIN player_details
    WHERE player_id=${playerId};`;
  const playerMatch = await db.get(matchPlayersQuery);
  response.send(playerMatch);
});
module.exports = app;
