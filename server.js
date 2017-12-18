// For Richard .env: DATABASE_URL=postgres://postgres:password@localhost:5432/pokeflip

require('dotenv').config();
const express = require('express');
const app = express();
const pg = require('pg');
const body = require('body-parser');
const cors = require('cors');
const superagent = require('superagent');
const pokeUrl = "http://pokeapi.co/api/v2/pokemon/";
const dexUrl = "https://pokeapi.co/api/v2/pokemon-species/";

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

app.get('/pokemonspecies/:dex', (req, res) => {
    const dex = req.params.dex;
    superagent
        .get(`${dexUrl}${dex}/`)
        .then((resp) => {
            const allEntries = resp.body.flavor_text_entries;
            res.send(findEnglishDexEntry(allEntries)); //looks for english entry
        });
});
//TODO DONE: create route for querying leaderbord names and scores.
app.get('/leaderboard', (req, res) => { // not tested
    client.query('SELECT * FROM leaderboard LIMIT 10')
        .then(data => res.send(data.rows))
        .catch(console.error);
});
//TODO DONE: create route for posting leaderboard names and scores.
app.post('/leaderboard/:name/:score', (req, res) => { // not tested
    console.log(req.body);
    client.query('INSERT INTO leaderboard (name, score) VALUES ($1, $2)', [req.params.name, req.params.score])
        .then(() => res.send('done'))
        .catch(console.error);
});
//TODO DONE: Will deliver 404 status message to the user when the requested route does not exist.
app.get('*', (request, response) => { // not tested
    response.status('404').send({error:'Not found!'});
});


app.listen(PORT, () => (console.log(`listening for api requests to ${PORT}`)));


//////// ** FUNCTIONS ** ////////
////////////////////////////////////////

function findEnglishDexEntry(allEntries) {
    let engEntry;
    for (let i = (allEntries.length - 1); i > 0; i--) {
        if (allEntries[i].language.name == 'en') { //if the name of that entry is english
            engEntry = allEntries[i].flavor_text; //set it and return it
            break;
        }
    }
    return engEntry;
}

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