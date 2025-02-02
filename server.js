const express = require('express')
const app = express()
const http = require('http').createServer(app)
const path = require('path')
const io = require('socket.io')(http)
const port = process.env.PORT || 1234
const fetch = require('node-fetch')
var connectionsLimit = 2

// Link the templating engine to the express app
app.set('view engine', 'ejs');

// Tell the views engine/ejs where the template files are stored (Settingname, value)
app.set('views', 'views');

app.use(express.static(path.resolve('public')))

let currentPokemon = null
app.get('/', async (req, res) => {
  if (!currentPokemon) {
    currentPokemon = await getPokemon()
  }
  res.render('index', {
    data: currentPokemon
  });
})

getPokemon = () => {
  let pokeNummer = Math.floor(Math.random() * 151);
  return fetch(`https://pokeapi.co/api/v2/pokemon/` + pokeNummer + ``)
    .then(response => response.json())
}

io.on('connection', (socket) => {
  // Limiet aan 2 spelers
  if (io.engine.clientsCount > connectionsLimit) {
    socket.emit('err', {
      message: 'reach the limit of connections'
    })
    socket.disconnect()
    console.log('Disconnected...')
  } 
  else {
    io.emit('count', {
      counter: io.engine.clientsCount 
    })
    
    console.log('a user connected')
    // Function die ik  aan roep via me script
    socket.on('refreshPokemon', () => {
      getPokemon().then(response => {
        io.emit('pokemonHTML', response)
      })
    })

    // player 1 function
    socket.on('player1Check', (check1) => {
      io.emit('player1Checkcode', check1)
    })

    // player 2 function
    socket.on('player2Check', (check2) => {
      io.emit('player2Checkcode', check2)
    })
  }

  socket.on('disconnect', () => {
    io.emit('count', {
      counter: io.engine.clientsCount 
    })
    console.log('user disconnected')
  })
})



http.listen(port, () => {
  console.log('listening on port ', port)
})