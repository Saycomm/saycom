const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Path to products data inside public/data folder
const FILE = path.join(__dirname, 'public', 'data', 'products.json');

app.use(cors());
app.use(express.json());

// Serving the 'public' directory as the web root (images, css, scripts)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/products', (req, res) => {
    if(!fs.existsSync(FILE)) {
        // Ensure data directory exists if not present
        const dir = path.dirname(FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(FILE, '[]');
    }
    try {
        const data = JSON.parse(fs.readFileSync(FILE));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Xatolik: " + error.message });
    }
});

app.post('/api/products', (req, res) => {
    try {
        const products = req.body;
        const dir = path.dirname(FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(FILE, JSON.stringify(products, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Saqlashda xatolik: " + error.message });
    }
});

// For any other routes, serve the main index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Saycom Production Server running on port ${PORT}`);
    console.log(`🔗 Local access: http://localhost:${PORT}`);
});
