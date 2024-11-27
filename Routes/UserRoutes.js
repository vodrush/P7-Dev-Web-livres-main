const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Validation d'email
const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

// Route pour l'inscription
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    // Vérifier que tous les champs sont remplis
    if (!email || !password) {
        return res.status(400).json({ error: 'Veuillez remplir tous les champs.' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Veuillez entrer une adresse email valide.' });
    }

    try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
        }

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer un nouvel utilisateur
        const newUser = new User({
            email,
            password: hashedPassword,
        });

        await newUser.save();
        res.status(201).json({ message: 'Utilisateur créé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur.' });
    }
});

// Route pour la connexion
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Utilisateur non trouvé. Veuillez vérifier votre adresse email.' });
        }

        // Vérifier la validité du mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Mot de passe incorrect. Veuillez réessayer.' });
        }

        // Générer le token JWT avec une expiration courte pour le test
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '10s' } // Expiration après 10 secondes
        );

        // Envoi du cookie contenant le token
        res.cookie('token', token, {
            httpOnly: true, // Empêche l'accès via JavaScript
            secure: false, // Passez à true si HTTPS
            sameSite: 'Lax', // Évite les attaques CSRF
            maxAge: 10 * 1000, // Expiration en 10 secondes
        });
        console.log("Token envoyé avec expiration de 10 secondes :", token);

        res.status(200).json({ userId: user._id, token });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ error: 'Erreur lors de la connexion.' });
    }
});

// Route pour se déconnecter
router.post('/logout', (req, res) => {
  try {
      res.clearCookie('token', {
          httpOnly: true,
          secure: false, // Passez à true si vous utilisez HTTPS
          sameSite: 'Lax', // Évite les attaques CSRF
      });
      console.log("Cookie 'token' supprimé.");
      res.status(200).json({ message: "Déconnexion réussie." });
  } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
      res.status(500).json({ error: "Erreur lors de la déconnexion." });
  }
});


module.exports = router;
