const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.all('/api/search', require('./api/search.js'));
app.all('/api/home', require('./api/home.js'));
app.all('/api/lyrics', require('./api/lyrics.js'));
app.all('/api/lyrics1', require('./api/lyrics1.js'));
app.all('/api/artist', require('./api/artist.js'));
app.all('/api/album', require('./api/album.js'));
app.all('/api/suggest', require('./api/suggest.js'));
app.all('/api/ytplay', require('./api/ytplay.js'));
const adminHandler = require('./api/admin.js');
app.all('/api/admin-login', (req, res) => { req.query.action = 'login'; return adminHandler(req, res); });
app.all('/api/admin-stats', (req, res) => { req.query.action = 'stats'; return adminHandler(req, res); });
app.all('/api/admin-users', (req, res) => { req.query.action = 'users'; return adminHandler(req, res); });
app.all('/api/admin-info', (req, res) => { req.query.action = 'info'; return adminHandler(req, res); });

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.all('/api/proxy-audio', require('./api/proxy-audio.js'));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    
    if (req.path.startsWith('/play/')) {
        const videoId = req.path.split('/play/')[1];
        if (videoId) {
            const cleanVideoId = videoId.split('?')[0].split('/')[0].replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20);
            if (!cleanVideoId) return res.sendFile(filePath);
            const coverUrl = `https://i.ytimg.com/vi/${cleanVideoId}/hqdefault.jpg`;
            const playTitle = `Dengarkan Musik - Beatsify`;
            const playDesc = `Dengarkan lagu favoritmu di Beatsify Web Music Player`;

            return fs.readFile(filePath, 'utf8', (err, html) => {
                if (err) return res.sendFile(filePath);
                
                let updatedHtml = html
                    .replace(/<title>.*?<\/title>/gi, `<title>${playTitle}</title>`)
                    .replace(/<meta property="og:title" content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${playTitle}">`)
                    .replace(/<meta property="og:description" content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${playDesc}">`)
                    .replace(/<meta property="og:image" content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${coverUrl}">`)
                    .replace(/<meta name="twitter:title" content=".*?"\s*\/?>/gi, `<meta name="twitter:title" content="${playTitle}">`)
                    .replace(/<meta name="twitter:description" content=".*?"\s*\/?>/gi, `<meta name="twitter:description" content="${playDesc}">`)
                    .replace(/<meta name="twitter:image" content=".*?"\s*\/?>/gi, `<meta name="twitter:image" content="${coverUrl}">`)
                    .replace(/<link rel="icon".*?>/gi, `<link rel="icon" type="image/jpeg" href="${coverUrl}">`)
                    .replace(/<link rel="apple-touch-icon".*?>/gi, `<link rel="apple-touch-icon" href="${coverUrl}">`);

                res.setHeader('Content-Type', 'text/html');
                return res.send(updatedHtml);
            });
        }
    }

    fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) return res.sendFile(filePath);
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
