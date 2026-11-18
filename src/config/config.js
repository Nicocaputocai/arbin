require('dotenv/config');

module.exports = {
  PORT: process.env.PORT || 4000,
  DB:
    process.env.DB ||
    `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.h5p3qok.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`,
  JWT_SECRET: process.env.JWT_SECRET,
};