const db = require('../model');
const TestValue = db.testValues

const TestValuesController = {
  getAllTestValues: async (req, res) => {
    const userId = req.user.userId
    try {
      const testValues = await TestValue.findAll({
        where: {userId},
      });
      res.send({
        data: [...testValues]
      });
    } catch (error) {
      res.status(200).json({ error: error.message });
    }
  },

  deleteAllTestValues: async (req, res) => {
    const userId = req.user.userId
    try {
        await TestValue.destroy({
          where: {userId},
        });
        res.status(204).send({
            data: []
        });
      } catch (error) {
        console.error(error);
        res.status(200).json({ error: 'Internal Server Error' });
      }
  }

};

module.exports = TestValuesController;
