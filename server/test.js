'use strict';

const bggClient = require('bgg-xml-api-client').bggXmlApiClient;
const fs = require('fs-extra');

const gameId = 385610; // Ersetze dies durch die tatsächliche ID des Spiels

// const url = `https://www.boardgamegeek.com/xmlapi2/thing?id=${gameId}&apikey=${apiKey}`;

(async () => {
  try {
    const res = await bggClient.get('thing', { id: gameId, stats: true });

    // Verarbeite die API-Antwort hier
    fs.writeJSON('gameInfo.json', res.data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
})();
