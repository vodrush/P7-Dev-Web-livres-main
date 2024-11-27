const express = require('express');
const sharp = require('sharp')
const router = express.Router();
const path = require('path');
const multer = require('multer');
const Book = require(path.resolve(__dirname, '../models/Bookshema'));
const authenticateToken = require('../middlewares/authenticateToken');
const checkOwnership = require('../middlewares/checkownership');

// Configure multer pour stocker l'image en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage });



// Route POST pour ajouter un livre avec image
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    console.log("Requête reçue sur /api/books");

    // Parse 'book' JSON encodé
    let bookData;
    try {
        bookData = JSON.parse(req.body.book);
        console.log("Données du livre reçues :", bookData);
    } catch (error) {
        return res.status(400).json({ error: "Format de données invalide pour le champ 'book'." });
    }

    // Extraire les données du livre à partir de `bookData`
    const { title, author, year, genre, ratings, averageRating, userId } = bookData;

    // Utiliser `rate` depuis `bookData` ou calculer à partir de `ratings`
    let rate = bookData.rate || (ratings && ratings[0] ? ratings[0].grade : undefined);
    const calculatedAverageRating = ratings
        ? ratings.reduce((sum, { grade }) => sum + grade, 0) / ratings.length
        : undefined;
    const finalAverageRating = averageRating !== undefined ? averageRating : calculatedAverageRating;
    rate = rate !== undefined ? rate : Math.round(finalAverageRating || 0);

    // Convertir l'image en base64 si elle est présente
    let imageBase64 = null;
    if (req.file) {
        try {
            console.log("Taille de l'image avant optimisation :", req.file.size);

            const optimizedImageBuffer = await sharp(req.file.buffer)
                .resize({ width: 800 })
                .jpeg({ quality: 80 })
                .toBuffer();

            console.log("Taille de l'image après optimisation :", optimizedImageBuffer.length);

            const mimeType = 'image/jpeg';
            imageBase64 = `data:${mimeType};base64,${optimizedImageBuffer.toString('base64')}`;
        } catch (err) {
            console.error("Erreur lors de l'optimisation de l'image :", err);
            return res.status(500).json({ error: "Erreur lors de l'optimisation de l'image." });
        }
    }

    try {
        // Créer un nouveau livre
        const newBook = new Book({
            userId,
            title,
            author,
            year: parseInt(year, 10),
            genre,
            ratings,
            averageRating: finalAverageRating,
            rate: parseInt(rate, 10),
            imageUrl: imageBase64 // Stocker l'URL de données base64 de l'image
        });

        // Enregistrer le livre dans la base de données
        await newBook.save();
        console.log("Livre ajouté avec succès :", newBook);
        res.status(201).json({ message: 'Livre ajouté avec succès', book: newBook });
    } catch (error) {
        console.error("Erreur lors de l'ajout du livre:", error);
        res.status(500).json({ error: "Erreur lors de l'ajout du livre." });
    }
});

// Route GET pour récupérer les livres les mieux notés
router.get('/bestrating', authenticateToken, async (req, res) => {
    console.log("Requête reçue sur /bestrating");

    try {
        // Requête simplifiée pour obtenir les livres triés par averageRating décroissant
        const bestRatedBooks = await Book.find().sort({ averageRating: -1 }).limit(3);

        if (!bestRatedBooks || bestRatedBooks.length === 0) {
            return res.status(404).json({ error: "Aucun livre trouvé avec une note moyenne." });
        }

        console.log("Livres récupérés :", bestRatedBooks);
        res.status(200).json(bestRatedBooks);
    } catch (error) {
        console.error("Erreur lors de la récupération des livres les mieux notés :", error);
        res.status(500).json({ error: "Erreur lors de la récupération des livres." });
    }
});




// Route GET pour récupérer l'image d'un livre spécifique
router.get('/:id/image', authenticateToken, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book || !book.image) {
            return res.status(404).json({ error: "Image non trouvée pour ce livre." });
        }
        const mimeType = "image/jpeg";
        res.set('Content-Type', mimeType);
        res.send(book.image);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'image :", error);
        res.status(500).json({ error: "Erreur lors de la récupération de l'image." });
    }
});


// Route GET pour récupérer tous les livres avec image encodée en base64
router.get('/', authenticateToken, async (req, res) => {
    try {
        const books = await Book.find(); // Récupère tous les livres

        // Convertir chaque image en base64 avec le bon type MIME
        const booksWithBase64Images = books.map(book => {
            if (book.image) {
                const mimeType = "image/jpg";
                return {
                    ...book._doc, // Inclure toutes les propriétés du livre
                    image: `data:${mimeType};base64,${book.image.toString('base64')}`
                };
            }
            return book;
        });

        res.status(200).json(booksWithBase64Images);
    } catch (error) {
        console.error("Erreur lors de la récupération des livres :", error);
        res.status(500).json({ error: "Erreur lors de la récupération des livres." });
    }
});
// Route GET pour récupérer un livre spécifique par son ID
const mongoose = require('mongoose');

router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;
    console.log("Utilisateur connecté :", req.user); // Log les infos utilisateur décodées du token
    console.log("ID du livre demandé :", req.params.id);

    console.log("Token décodé, userId :", userId); // Log l'userId extrait du token
    console.log("ID du livre reçu :", id); // Log l'ID du livre reçu

    // Vérification de la validité de l'ID du livre
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error("ID de livre invalide :", id);
        return res.status(400).json({ error: "ID de livre invalide." });
    }

    try {
        // Rechercher le livre dans la base de données
        const book = await Book.findById(id);

        if (!book) {
            console.error("Livre non trouvé :", id);
            return res.status(404).json({ error: "Livre non trouvé." });
        }

        // Vérifier si l'utilisateur connecté est l'auteur du livre
        const isAuthor = book.userId.toString() === userId;
        console.log("Utilisateur connecté est l'auteur :", isAuthor);

        res.status(200).json({ ...book.toObject(), isAuthor });
    } catch (error) {
        console.error("Erreur lors de la récupération du livre :", error);
        res.status(500).json({ error: "Erreur lors de la récupération du livre." });
    }
});


router.post('/:id/rating', authenticateToken, async (req, res) => {
    const bookId = req.params.id;
    let { userId, grade } = req.body;

    console.log("ID du livre reçu :", bookId);
    console.log("Données de notation reçues :", { userId, grade });


    if (grade === undefined) {
        try {
            grade = parseInt(req.body.rating || req.body.grade, 10);
        } catch (error) {
            console.error("Erreur lors de la conversion de la note :", error);
        }
    }

    // Vérifiez la validité de l'ID du livre et des données de notation
    if (!mongoose.Types.ObjectId.isValid(bookId) || !userId || grade === undefined || isNaN(grade)) {
        console.error("Données invalides ou incomplètes pour la notation.");
        return res.status(400).json({ error: "Données de notation incomplètes ou ID de livre invalide." });
    }

    try {
        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({ error: "Livre non trouvé." });
        }

        const existingRating = book.ratings.find(rating => rating.userId.toString() === userId);
        if (existingRating) {
            return res.status(400).json({ error: "Vous avez déjà noté ce livre." });
        }

        book.ratings.push({ userId, grade });

        const totalRatings = book.ratings.length;
        const sumRatings = book.ratings.reduce((sum, rating) => sum + (rating.grade || 0), 0);
        const newAverageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

        book.averageRating = newAverageRating;

        await book.save();
        res.status(200).json(book);
    } catch (error) {
        console.error("Erreur lors de l'ajout de la note :", error);
        res.status(500).json({ error: "Erreur lors de l'ajout de la note." });
    }
});
// Route DELETE pour supprimer un livre par son ID
router.delete('/:id', authenticateToken, checkOwnership, async (req, res) => {
    const { id } = req.params;

    console.log("Requête de suppression reçue pour le livre avec l'ID :", id);

    // Vérification de la validité de l'ID du livre
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID de livre invalide." });
    }

    try {
        const book = await Book.findByIdAndDelete(id);

        if (!book) {
            return res.status(404).json({ error: "Livre non trouvé." });
        }

        console.log("Livre supprimé avec succès :", book);
        res.status(200).json({ message: "Livre supprimé avec succès." });
    } catch (error) {
        console.error("Erreur lors de la suppression du livre :", error);
        res.status(500).json({ error: "Erreur lors de la suppression du livre." });
    }
});
// Route PUT pour mettre à jour un livre par ID
router.put('/:id', authenticateToken, checkOwnership, upload.single('image'), async (req, res) => {
    const { id } = req.params;

    // Vérification de la validité de l'ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error("ID de livre invalide :", id);
        return res.status(400).json({ error: "ID de livre invalide." });
    }

    try {
        console.log("Requête reçue pour mettre à jour un livre avec ID :", id);
        console.log("Corps de la requête reçu :", req.body);


        let bookData = req.body;


        if (bookData.book) {
            try {
                bookData = JSON.parse(bookData.book);
            } catch (error) {
                console.error("Erreur de parsing des données : ", error.message);
                return res.status(400).json({ error: "Données de mise à jour non valides." });
            }
        }

        const { userId, title, author, year, genre } = bookData;


        if (!year || isNaN(Number(year))) {
            console.error("L'année fournie est invalide :", year);
            return res.status(400).json({ error: "L'année fournie est invalide." });
        }


        const yearInt = parseInt(year, 10);

        let imageBase64 = null;
        if (req.file) {
            try {
                console.log("Taille de l'image avant optimisation :", req.file.size);

                const optimizedImageBuffer = await sharp(req.file.buffer)
                    .resize({ width: 800 })
                    .jpeg({ quality: 80 })
                    .toBuffer();

                console.log("Taille de l'image après optimisation :", optimizedImageBuffer.length);

                const mimeType = 'image/jpeg';
                imageBase64 = `data:${mimeType};base64,${optimizedImageBuffer.toString('base64')}`;
            } catch (err) {
                console.error("Erreur lors de l'optimisation de l'image :", err);
                return res.status(500).json({ error: "Erreur lors de l'optimisation de l'image." });
            }
        }


        const updatedData = {
            title,
            author,
            year: yearInt,
            genre,
            userId
        };

        if (imageBase64) {
            updatedData.imageUrl = imageBase64;
        }

        // Mettre à jour le livre dans la base de données
        const updatedBook = await Book.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedBook) {
            return res.status(404).json({ error: "Livre non trouvé." });
        }

        console.log("Livre mis à jour avec succès :", updatedBook);
        res.status(200).json({ message: 'Livre mis à jour avec succès', book: updatedBook });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du livre :", error);
        res.status(500).json({ error: "Erreur lors de la mise à jour du livre." });
    }
});













module.exports = router;
