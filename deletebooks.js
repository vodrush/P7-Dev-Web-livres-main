// Script pour supprimer tous les livres de la base de données
const axios = require('axios');

const removeAllBooks = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/books');
        const books = response.data;

        for (const book of books) {
            try {
                await axios.delete(`http://localhost:3000/api/books/${book._id}`);
                console.log(`Livre supprimé : ${book.title}`);
            } catch (error) {
                console.error(`Erreur lors de la suppression du livre : ${book.title}`, error.response?.data || error.message);
            }
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des livres :', error.response?.data || error.message);
    }
};

removeAllBooks();