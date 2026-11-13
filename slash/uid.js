const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uid')
    .setDescription('Muestra la información de un usuario de Discord')
    .addUserOption(o =>
      o.setName('usuario')
       .setDescription('Usuario a consultar')
       .setRequired(false)
    )
};