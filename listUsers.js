const mongoose = require('mongoose');
const User = require('./models/User'); 
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connexion à MongoDB réussie !");
        User.find()
            .then(users => {
                console.log("Utilisateurs dans la base de données : ", users);
                mongoose.connection.close();
            })
            .catch(err => console.error("Erreur lors de la récupération des utilisateurs :", err));
    })
    .catch(err => console.error("Erreur de connexion à MongoDB :", err));
