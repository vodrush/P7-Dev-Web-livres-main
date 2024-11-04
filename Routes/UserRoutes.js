const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };
  
  router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
  
    // Vérifier que l'email est valide
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Veuillez entrer une adresse email valide.' });
    }
  
    if (!email || !password) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs.' });
    }
  
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
      }
  
      // Créer un nouvel utilisateur
      const newUser = new User({ email, password });
      await newUser.save();
  
      res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur.' });
    }
  });
  
  

// Route pour la connexion
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Rechercher l'utilisateur dans la base de données
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Utilisateur non trouvé. Veuillez vérifier votre adresse email.' });
        }

        // Comparer le mot de passe fourni avec celui stocké (haché)
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Mot de passe incorrect. Veuillez réessayer.' });
        }

        // Créer un token JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ userId: user._id, token });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ error: 'Erreur lors de la connexion.' });
    }
});


module.exports = router;
