CREATE DATABASE pokeflip;

CREATE TABLE leaderboard (id serial PRIMARY KEY, name VARCHAR(50), score INTEGER);
CREATE TABLE pokemon (id serial PRIMARY KEY, dex_number INTEGER UNIQUE, name VARCHAR(25), img_url VARCHAR(300), type VARCHAR(25));