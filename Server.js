const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const authenticateToken = require('./middlewares/authenticateToken');

const userRoutes = require('./routes/UserRoutes');
const bookRoutes = require('./routes/BookRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware CORS pour autoriser les cookies
app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true, // Autorise l'envoi et la réception des cookies
}));

// Middleware pour parser les cookies
app.use(cookieParser());

// Middleware pour parser les corps des requêtes
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Logs de debug
app.use((req, res, next) => {
    console.log(`Requête reçue : ${req.method} ${req.url}`);
    console.log('Headers reçus :', req.headers);
    console.log('Cookies reçus :', req.cookies);
    next();
});

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(err => console.error('Connexion à MongoDB échouée :', err));

// Routes utilisateur
app.use('/api/auth', userRoutes);

// Routes livres
app.use('/api/books', authenticateToken, bookRoutes);

// Route pour servir le frontend React
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Middleware global pour gérer les erreurs
app.use((err, req, res, next) => {
    console.error("Erreur détectée :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur backend en cours d'exécution sur le port ${port}`);
});
