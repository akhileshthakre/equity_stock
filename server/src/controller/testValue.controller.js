const db = require('../model');
const TestValue = db.testValues

const TestValuesController = {
  getAllTestValues: async (req, res) => {
    try {
      const testValues = await TestValue.findAll();
      res.send({
        data: [...testValues]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteAllTestValues: async (req, res) => {
    try {
        await TestValue.destroy({
          where: {},
        });
        res.status(204).send({
            data: []
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
  }

};

module.exports = TestValuesController;
