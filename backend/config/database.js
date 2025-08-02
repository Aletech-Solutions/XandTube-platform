const { Sequelize } = require('sequelize');
const path = require('path');

// Configuração do SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false, // Desativa logs SQL no console
  define: {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    underscored: true, // Usa snake_case ao invés de camelCase
  }
});

module.exports = sequelize;