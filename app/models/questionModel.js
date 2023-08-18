const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: String,
  answer: String,
  image: String,
  relatedQuestions: [Number],
  relatedTopics: [String],
  subject: String,
});

module.exports = mongoose.model('Question', questionSchema);
