// Script pour ajouter tous les livres dans la base de données avec leurs images
const axios = require('axios');
const fs = require('fs');

const books = [
    {
        title: "Milwaukee Mission",
        author: "Elder Cooper",
        year: 2021,
        genre: "Policier",
        averageRating: 4,
        imagePath: "./reset/milwaukee_mission.jpg"
    },
    {
        title: "Book for Esther",
        author: "Alabaster",
        year: 2022,
        genre: "Paysage",
        averageRating: 5,
        imagePath: "./reset/book_for_esther.jpg"
    },
    {
        title: "The Kinfolk Table",
        author: "Nathan Williams",
        year: 2022,
        genre: "Cuisine",
        averageRating: 5,
        imagePath: "./reset/the_kinfolk_table.jpg"
    },
    {
        title: "Thinking Fast & Slow",
        author: "Daniel Kahneman",
        year: 2022,
        genre: "Economie",
        averageRating: 5,
        imagePath: "./reset/thinking_fast_slow.jpg"
    },
    {
        title: "Company of One",
        author: "Paul Jarvis",
        year: 2022,
        genre: "Business",
        averageRating: 5,
        imagePath: "./reset/company_of_one.jpg"
    },
    {
        title: "Design Anthology",
        author: "James Doe",
        year: 2022,
        genre: "Architecture",
        averageRating: 4,
        imagePath: "./reset/design_anthology.jpg"
    },
    {
        title: "Book of Genesis",
        author: "Alabaster",
        year: 2022,
        genre: "Jardinage",
        averageRating: 5,
        imagePath: "./reset/book_of_genesis.jpg"
    },
    {
        title: "Psalms",
        author: "Alabaster",
        year: 2022,
        genre: "Poésie",
        averageRating: 5,
        imagePath: "./reset/psalms.jpg"
    },
    {
        title: "Milk & Honey",
        author: "Rupi Kaur",
        year: 2022,
        genre: "Ecologie",
        averageRating: 5,
        imagePath: "./reset/milk_and_honey.jpg"
    },
    {
        title: "Stupore e Tremori",
        author: "Amélie Nothomb",
        year: 2018,
        genre: "Roman",
        averageRating: 5,
        imagePath: "./reset/stupore_e_tremori.jpg"
    },
    {
        title: "Cereal",
        author: "Van Duysen",
        year: 2022,
        genre: "Architecture",
        averageRating: 5,
        imagePath: "./reset/cereal.jpg"
    },
    {
        title: "Zero to One",
        author: "Peter Thiel",
        year: 2022,
        genre: "Business",
        averageRating: 5,
        imagePath: "./reset/zero_to_one.jpg"
    }
];

books.forEach(async (book) => {
    try {
        const image = fs.readFileSync(book.imagePath);
        const imageBase64 = image.toString('base64');
        const mimeType = 'image/jpeg'; // Assurez-vous que c'est le bon type MIME pour votre image

        const response = await axios.post('http://localhost:3000/api/books', {
            book: JSON.stringify({
                userId: "6728f9b23756570ca10aeca0", // Remplacer par un vrai userId si disponible
                title: book.title,
                author: book.author,
                year: book.year,
                genre: book.genre,
                ratings: [
                    {
                        userId: "6728f9b23756570ca10aeca0",
                        grade: book.averageRating,
                    },
                ],
                averageRating: book.averageRating,
            }),
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            image: imageBase64,
            mimeType: mimeType
        });
        console.log(`Livre ajouté : ${book.title}`, response.data);
    } catch (error) {
        console.error(`Erreur lors de l'ajout du livre : ${book.title}`, error.response?.data || error.message);
    }
});
