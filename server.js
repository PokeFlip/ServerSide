// For Richard .env: DATABASE_URL=postgres://postgres:password@localhost:5432/pokeflip

require('dotenv').config();
const express = require('express');
const app = express();
const pg = require('pg');
const body = require('body-parser');
const cors = require('cors');
const superagent = require('superagent');
const pokeUrl = "http://pokeapi.co/api/v2/pokemon/";
// const dexUrl = "https://pokeapi.co/api/v2/pokemon-species/";

const PORT = process.env.PORT;
console.log(PORT);
const conString = process.env.DATABASE_URL;
const client = new pg.Client(conString);
client.connect();

app.use(cors());
app.use(body.json());
app.use(body.urlencoded({extended: true}));

loadLeaderboardTable();
loadPokemonTable();

app.get('/pokemon/dex/:dex', (req, res) => {
    const dex = req.params.dex;
    superagent
        .get(`${pokeUrl}${dex}/`)
        .then((resp) => {
            const poke = resp.body;
            const typeSlot = () => {
                return (poke.types.length > 1) ? poke.types[1].type.name : poke.types[0].type.name; //if the pokemon has two types, select the main type
            };
            const pokeObj = {
                name: poke.name || 'n/a',
                dex_number: poke.id,
                img_url: poke.sprites.front_default || 'n/a',
                type: poke.types ? typeSlot() : 'n/a'
            };
            insertPokemon(pokeObj);
            res.send('done');
        })
        .catch(console.error);
});

app.get('/pokemon/:type', (req, res) => {
    const type = req.params.type;
    client.query(`
        SELECT * FROM pokemon WHERE type = $1 ORDER BY RANDOM() LIMIT 5`, [type]
    )
        .then(types => res.send(types.rows))
        .catch(console.error);
});

app.listen(PORT, () => (console.log(`listening for api requests to ${PORT}`)));

// app.get('/pokemon/:type', (req, res) => { // PROBABLY NOT WORKING
//     const type = req.params.type;
//     superagent
//         .get(`${dexUrl}${type}/`)
//         .then((res) => {
//             const pokeReturn = res.body.items.slice(0,5).map( poke => {
//                 return {
//                     name: poke.name || 'n/a',
//                     dex_number: poke.id || 'n/a',
//                     img_url: poke.sprites.front_default || 'n/a',
//                     description: poke.flavor_text_entries || 'n/a'
//                 };
//             });
//         });
// });

//////// ** DATABASE LOADERS ** ////////
////////////////////////////////////////

function insertPokemon(poke) {
    console.log(poke);
    client.query(
        'INSERT INTO pokemon (name, dex_number, img_url, type) VALUES ($1, $2, $3, $4)',
        [poke.name, poke.dex_number, poke.img_url, poke.type])
        .catch(console.error);
}

function loadLeaderboardTable() {
    client.query(
        `CREATE TABLE IF NOT EXISTS leaderboard (id serial PRIMARY KEY, name VARCHAR(50), score INTEGER);`
    )
        .catch(console.error);
}

function loadPokemonTable() {
    client.query(
        `CREATE TABLE IF NOT EXISTS pokemon (id serial PRIMARY KEY, dex_number INTEGER UNIQUE, name VARCHAR(25), img_url VARCHAR(300), type VARCHAR(25));`
    )
        .catch(console.error);
}