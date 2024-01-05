const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../public/views'));

app.get('/', (req, res) => {
  res.render('index', { title: 'Bienvenue sur mon site !' });
});

app.use(express.static(path.join(__dirname, 'src')));

app.listen(port, () => {
  console.log(`Le serveur est en marche sur le port ${port}`);
});
