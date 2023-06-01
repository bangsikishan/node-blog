const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin';

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if(!token) {
        return res.status(401).json({ message: "Unauthorized!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized!" });
    }
};


router.get('/admin', async (req, res) => {
    try {
        res.render('admin/index', { layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
});


router.post('/admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });

        if(!user) {
            return res.status(401).json({ message: "Invalid credentials!" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials!" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.cookie('token', token, { httpOnly: true });

        res.redirect('/dashboard');
        
    } catch (error) {
        console.log(error);
    }
});


router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await User.create({ username, password: hashedPassword });
            res.status(201).json({ message: "User created", user });
        } catch (error) {
            if(error.code === 11000) {
                res.status(409).json({ message: "User already exists!" });
            }
            res.status(500).json({ message: "Internal server error" });
        }
        
    } catch (error) {
        console.log(error);
    }
});


router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const data = await Post.find();
        res.render('admin/dashboard', { data, layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
});


router.get('/add-post', authMiddleware, async (req, res) => {
    try {
        res.render('admin/add-post', { layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
});


router.post('/add-post', authMiddleware, async (req, res) => {
    try {
        const { title, body } = req.body;

        const newPost = new Post({ title, body });
        
        await Post.create(newPost);
        
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
    }
});

module.exports = router;