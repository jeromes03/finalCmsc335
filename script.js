const fs = require("fs");
const path = require("path");
const express = require("express");
const axios = require('axios');
const bodyParser = require("body-parser");
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') }) 
const username= process.env.MONGO_DB_USERNAME;
const password= process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');
const { response } = require("express");
const { dirname } = require("path");
let userFound= false
let movieArr=[]

const app = express();
const portNumber = 3000;

let genreId = 0;

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join('templates')))

app.get("/", (request, response) => {
    response.render('welcomePage');
});


app.get("/welcomePage", (request,response) =>{
    response.render('welcomePage')
})

app.get("/returnUserPage", (request, response) => {
    response.render('returnUserPage')
})

app.get("/returnUser", async (request, response) => {
  const newUsername = request.query.username; 
  const newPassword = request.query.password;
  const uri= `mongodb+srv://${username}:${password}@cmsc335db.ysb7zsp.mongodb.net/?retryWrites=true&w=majority`
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

  try {
          await client.connect();
              await lookUpOneEntry(client, databaseAndCollection, newUsername, newPassword);
              while (!userFound) {
                response.render('invalidUserPage');
                return;
              }
              if (userFound) {
                response.render('returnUserPage')
              }
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
});

async function lookUpOneEntry(client, databaseAndCollection, username, password) {
  let filter = {username: username, password: password};
  userFound = false

      const result = await client.db(databaseAndCollection.db)
          .collection(databaseAndCollection.collection)
          .findOne(filter);
      if (result) {
          userFound= true
      } else {
          console.log(`No user found with username or password ${username}`);
      }
      
}

app.get("/newUser", async (request, response) => {
  const newUsername = request.query.username; 
  const newPassword = request.query.password;
  const uri= `mongodb+srv://${username}:${password}@cmsc335db.ysb7zsp.mongodb.net/?retryWrites=true&w=majority`
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

  try {
      await client.connect();
      let userData = {username: newUsername, password: newPassword};
      await insertUser(client, databaseAndCollection, userData);

      response.render('welcomePage');

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
});

async function insertUser(client, databaseAndCollection, user) {
  const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(user);
}


app.get("/userNextPage", async (request, response) => {
    const movieType = request.query.movieType;

    if (movieType == "Action") {
        genreId = 28;
    } else if (movieType == "Adventure") {
        genreId = 12;
    } else if (movieType == "Animation") {
        genreId = 16;
    } else if (movieType == "Comedy") {
        genreId = 35;
    } else if (movieType == "Crime") {
        genreId = 80;
    }

    try {
        const apiKey = '56a92ac997d7396916ccef967637d1d6'; 
        const movies = await getMoviesByGenre(apiKey, genreId);


        if (movies) {
            movieArr = []
            movies.forEach((movie) => {
                
                movieArr.push(movie.title);
            });
        } else {
            console.log('No movies found.');
            response.render('errorPage'); 
        }


        let randomIndex = Math.floor(Math.random() * movieArr.length);
        
        response.render('userNextPage', { movie: movieArr[randomIndex] })
    } catch (error) {
        console.error('Error:', error.message);    }
});

function getMoviesByGenre(apiKey, genreId) {
    const baseUrl = 'https://api.themoviedb.org/3/discover/movie';

    return axios.get(baseUrl, {
        params: {
            api_key: apiKey,
            with_genres: genreId,
        },
    })
    .then(response => response.data.results)
    .catch(error => {
        console.error('Error fetching movies:', error.message);
        throw error;
    });
}

app.listen(portNumber, () => {
    console.log(`Web server started and running at http://localhost:${portNumber}`);
});

process.stdin.setEncoding("utf8");

if (process.argv.length != 2) {
    process.stdout.write("Usage script.js");
    process.exit(1);
}

const prompt = "Type stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop") {
            process.stdout.write("Shutting down the server");
            process.exit(0);
        } else {
            console.log(`Invalid command: ${command}`);
        }

        process.stdout.write(prompt);
        process.stdin.resume();
    }
});