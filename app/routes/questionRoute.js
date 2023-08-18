const express = require('express');
const questionController = require('../controllers/questionController');

const router = express.Router();

router.get('/:id', questionController.getQuestion);
router.post('/add', questionController.addQuestion);
router.get('/list', questionController.listQuestions);
router.get('/all', questionController.getAllQuestions);
router.post('/search', questionController.searchQuestion);
router.post('/topic', questionController.searchByTopic);
router.post('/subject', questionController.searchBySubject);
router.post('/topicORsubject', questionController.searchByTopicOrSubject);
router.post('/question', questionController.searchByQuestion);

module.exports = router;
