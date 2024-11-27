const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    let token;

    // Vérifier si le token est présent dans les cookies
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        console.error("Token manquant.");
        // Vérification si requête JSON (API)
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(401).json({ redirect: '/Connexion', message: 'Token manquant ou invalide.' });
        }
        return res.redirect('/Connexion');
    }

    try {
        // Vérifier la validité du token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: decoded.userId }; // Ajouter les informations utilisateur à la requête
        next(); // Passer au middleware ou à la route suivante
    } catch (error) {
        console.error("Erreur de validation du token :", error.message);

        if (error.name === 'TokenExpiredError') {
            console.log("Token expiré.");
            // Réponse JSON pour une requête API
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.status(401).json({ redirect: '/api/auth/login', message: 'Session expirée. Veuillez vous reconnecter.' });
            }
            return res.redirect('/Connexion');
        }

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(403).json({ redirect: '/api/auth/login', message: 'Token invalide.' });
        }
        return res.redirect('/Connexion');
    }
};

module.exports = authenticateToken;
