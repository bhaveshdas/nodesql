const Sequelize = require('sequelize');

const sequelize = new Sequelize('node_complete', 'root', 'e4d5exd5Qxd5Nc3', {
  dialect: 'mysql',
  host: 'localhost'
});

module.exports = sequelize;
