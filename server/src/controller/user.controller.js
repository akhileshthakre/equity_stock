const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../model');
require('dotenv').config()
const User = db.user;

//this will only use if JWT_SECRET_KEY not present
const generateNewSecretKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const spareSecretKey = generateNewSecretKey();

const generateToken = (userId, username) => {
  try {
    const token = jwt.sign({ userId, username }, process.env.JWT_SECRET_KEY || spareSecretKey, {
      expiresIn: '2h',
    });
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Error generating token');
  }
};

const UserController = {
  createUser: async (req, res) => {
    const { name, email, password, isAdmin } = req.body;
    try {
      const existingUser = await User.findOne({ where: { email } });
  
      if (existingUser) {
        return res.status(400).json({ error: `Username ${email} already have account` });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, password: hashedPassword });
  
      res.status(201).json({ userId: newUser.id, username: newUser.email });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  

  loginUser: async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await User.findOne({ where: { email: username } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid Username' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid Password' });
      }
      const token = generateToken(user.id, user.email);
      res.json({ username, token });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

};

module.exports = { UserController, spareSecretKey};
