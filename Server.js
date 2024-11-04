const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const open = require('open');
require('dotenv').config();
require('app-module-path').addPath(__dirname);
const userRoutes = require('./routes/UserRoutes');
const bookRoutes = require(path.join(__dirname, 'Routes', 'BookRoutes.js'));

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Parser les données x-www-form-urlencoded pour les formulaires classiques
app.use(express.urlencoded({ extended: true }));

// Parser les données JSON
app.use(express.json());
console.log("Middleware JSON et form-data actifs.");

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connexion à MongoDB réussie !"))
    .catch(err => console.log("Connexion à MongoDB échouée :", err));

// Utilisation des routes utilisateur
app.use('/api/auth', userRoutes);

// Utilisation des routes des livres
app.use('/api/books', bookRoutes);

app.use((req, res, next) => {
    console.log(`Requête reçue : ${req.method} ${req.url}`);
    console.log('Body reçu :', req.body);
    next();
});

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, 'build')));

// Route de fallback pour le frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`Serveur backend en cours d'exécution sur le port ${port}`);
});
