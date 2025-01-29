require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const pool = new Pool({
    user: "postgres", // Replace with your PostgreSQL username
    host: "localhost",
    database: "login", // Replace with your database name
    password: "san123ss", // Replace with your PostgreSQL password
    port: 5432,
});

app.use(cors());
app.use(express.json());

// Register User
app.post("/register", async (req, res) => {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const result = await pool.query(
            "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [username, email, hashedPassword, role]
        );
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login User
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ error: "User not found" });
        }
        
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        
        const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, process.env.JWT_SECRET || "secretkey", { expiresIn: "1h" });
        res.json({ token, role: user.rows[0].role });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// // CRUD Operations for Books
// app.post("/books", async (req, res) => {
//     const { title, author, genre, copies_available } = req.body;
//     try {
//         await pool.query(
//             "INSERT INTO books (title, author, genre, copies_available) VALUES ($1, $2, $3, $4)",
//             [title, author, genre, copies_available]
//         );
//         res.status(201).json({ message: "Book added successfully" });
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });

// app.get("/books", async (req, res) => {
//     try {
//         const result = await pool.query("SELECT * FROM books");
//         res.json(result.rows);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });

// app.put("/books/:id", async (req, res) => {
//     const { title, author, genre, copies_available } = req.body;
//     const { id } = req.params;
//     try {
//         await pool.query(
//             "UPDATE books SET title = $1, author = $2, genre = $3, copies_available = $4 WHERE id = $5",
//             [title, author, genre, copies_available, id]
//         );
//         res.json({ message: "Book updated successfully" });
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });

// app.delete("/books/:id", async (req, res) => {
//     const { id } = req.params;
//     try {
//         await pool.query("DELETE FROM books WHERE id = $1", [id]);
//         res.json({ message: "Book deleted successfully" });
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });
app.get("/users" ,async(req , res) => {
    try{
        const result = await pool.query(
                "SELECT * FROM users"
        )
        res.json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get("/users/:id", async (req, res) => {
    try {
        const { id } = req.params; // Get user ID from URL
        const result = await pool.query(
            "SELECT username, email, password_hash, role FROM users WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(result.rows[0]); // Return user data
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// CRUD Operations for Books
app.post("/books", async (req, res) => {
    const { title, author, genre, quantity, price } = req.body;
    try {
        await pool.query(
            "INSERT INTO books (title, author, genre, quantity, price) VALUES ($1, $2, $3, $4, $5)",
            [title, author, genre, quantity, price]
        );
        res.status(201).json({ message: "Book added successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get("/books", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM books");
        res.json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put("/books/:id", async (req, res) => {
    const { title, author, genre, quantity, price } = req.body;
    const { id } = req.params;
    try {
        await pool.query(
            "UPDATE books SET title = $1, author = $2, genre = $3, quantity = $4, price = $5 WHERE id = $6",
            [title, author, genre, quantity, price, id]
        );
        res.json({ message: "Book updated successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete("/books/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM books WHERE id = $1", [id]);
        res.json({ message: "Book deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
