const db = require('../model');
const User = db.users

const UserController = {
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll();
      res.send({
        data: [...users]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserById: async (req, res) => {
    const { body } = req
    console.log(body)
    try {
      const user = await User.findOne({
        where: body.id,
      });
      res.send({
        data: user
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

};

module.exports = UserController;
