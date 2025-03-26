
require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "login",
    password: process.env.DB_PASSWORD || "san123ss",
    port: process.env.DB_PORT || 5432,
});

app.use(cors());
app.use(express.json());

// Authentication Middleware
function authenticateToken(req, res, next) {
    const token = req.header("Authorization")?.split(" ")[1]; // Assuming "Bearer <token>"
    if (!token) return res.status(401).json({ error: "Access Denied" });

    jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid Token" });
        req.user = user;
        next();
    });
}

// Register Route
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

// Login Route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const userQuery = await pool.query(
            "SELECT id, username, email, password_hash, role FROM users WHERE email = $1",
            [email]
        );

        if (userQuery.rows.length === 0) {
            return res.status(400).json({ error: "User not found" });
        }

        const user = userQuery.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "secretkey",
            { expiresIn: "1h" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CRUD Operations for Users
app.get("/users", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get("/users/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT username, email, password_hash, role FROM users WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CRUD Operations for Books
app.post("/books", authenticateToken, async (req, res) => {
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

app.put("/books/:id", authenticateToken, async (req, res) => {
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

app.delete("/books/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query("DELETE FROM books WHERE id = $1", [id]);
        res.json({ message: "Book deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start the server
app.listen(5000, () => console.log("Server running on port 5000"));
