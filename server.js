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




app.get('/game', (req, res) => {
    const id = req.params.id;
    superagent
        .get(`${pokeUrl}${id}/`)
        .end((err, resp) => {
            const poke = resp.body
                return {
                    name: poke.name || 'n/a',
                    dex_number: poke.id,
                    img_url: poke.sprites.front_default || 'n/a',
                    type: poke.types.type ? poke.types.type[0] || 'n/a'
                };
            });
            res.send(poke);
        }

});


app.listen(PORT, () => (console.log(`listening for api requests to ${PORT}`)));



//////// ** DATABASE LOADERS ** ////////
////////////////////////////////////////

function loadPokemon() {
    fs.readFile('books.json', (err, fd) => {
        JSON.parse(fd.toString()).forEach(ele => {
            client.query(
                'INSERT INTO books(title, author, isbn, "image_url", description) VALUES($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
                [ele.title, ele.author, ele.isbn, ele.image_url, ele.description]
            )
                .catch(console.error);
        });
    });
}

function loadLeaderboard() {
    client.query(`CREATE TABLE IF NOT EXISTS leaderboard (id serial PRIMARY KEY, name VARCHAR(50), score INTEGER);`
    )
        .catch(console.error);
}

function loadPokemon() {
    client.query(`CREATE TABLE IF NOT EXISTS pokemon (id serial PRIMARY KEY, dex_number INTEGER UNIQUE, name VARCHAR(25), img_url VARCHAR(300), type VARCHAR(25));`
    )
        .then(loadPokemon)
        .catch(console.error);
}