require("dotenv").config();
const express = require("express"); 
const { Pool } = require("pg"); 
const app = express(); 
const port = process.env.PORT || 3000;


app.use(express.json());

const pool = new Pool({
    user: process.env.DATABASE_USER, 
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
});

// Création de la table articles
pool.query(`
    CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL
    )
`)
    .then(() => console.log("Table articles créée ou déjà existante"))
    .catch((err) => console.error(`Erreur lors de la création de la table: ${err}`));


    //methode get 

    app.get('/articles', async (req, res) => {
        try {
            const result = await pool.query("SELECT * FROM articles ORDER BY id ASC");
    
            if (result.rows.length <= 0 || !result.rows) {
                throw new Error("La table articles est vide ou inexistante");
            }
    
            res.status(200).json(result.rows);
        } catch (err) {
            res.status(500).json({
                "message": `Une erreur s'est produite lors de la tentative de récupération des articles : ${err}.`
            });
        }
    });

    //methode post
    app.post("/articles", async (req, res) => {
        try {
            const { title, content, author } = req.body;
    
            const result = await pool.query(
                "INSERT INTO articles(title, content, author) VALUES($1, $2, $3) RETURNING *",
                [title, content, author]
            );
    
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({
                message: `Erreur lors de la création de l'article : ${err}`
            });
        }
    });

    //methode patch

    app.patch("/articles/edit/title", async (req, res) => {
        try {
            const { id, title } = req.body;
    
            const result = await pool.query(
                "UPDATE articles SET title=$2 WHERE id=$1 RETURNING *",
                [id, title]
            );
    
            res.status(200).json({
                message: "Le titre de l'article a été modifié",
                result: result.rows[0]
            });
        } catch (err) {
            res.status(500).json({
                message: `Échec lors de la tentative de mise à jour du titre de l'article : ${err}`
            });
        }
    });

    //methode delete 
    app.delete("/articles/:id", async (req, res) => {
        try {
            const { id } = req.params;
    
            const result = await pool.query(
                "DELETE FROM articles WHERE id=$1 RETURNING *",
                [id]
            );
    
            if (result.rowCount === 0) {
                throw new Error("L'article n'a pas été trouvé ou n'existe pas.");
            }
    
            res.status(200).json({
                message: "Article supprimé avec succès",
                deletedArticle: result.rows[0]
            });
        } catch (err) {
            res.status(500).json({
                message: `Échec lors de la suppression de l'article : ${err}`
            });
        }
    });

    // Démarrage du serveur
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

