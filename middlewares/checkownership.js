const Book = require('../models/Bookshema'); // Remplace par ton chemin correct

const checkOwnership = async (req, res, next) => {
    const { id } = req.params; 
    const { userId } = req.user; 

    try {
        const book = await Book.findById(id);

        if (!book) {
            return res.status(404).json({ message: "Ressource non trouvée." });
        }

        if (book.userId.toString() !== userId) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à effectuer cette action." });
        }

        // Ajoute la ressource dans req pour réutilisation si nécessaire
        req.book = book;
        next();
    } catch (error) {
        console.error("Erreur lors de la vérification de propriété :", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

module.exports = checkOwnership;
