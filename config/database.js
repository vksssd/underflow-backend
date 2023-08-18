const mongoose = require('mongoose');
const user = process.env.USERID;
const pass=process.env.PASSWORD
mongoose.connect('mongodb+srv://`${user}`:`${pass}`@cluster0.dmiqf6z.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
