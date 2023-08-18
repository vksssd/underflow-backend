const Question = require('../models/questionModel');
const Fuse = require('fuse.js');


const getQuestion = async (req, res) => {
  const questionId = req.params._id;

  try {
    const question = await Question.findOne({ id: questionId });

    if (!question) {
      console.log(`Question with ID ${questionId} not found`);
      return res.status(404).json({ message: 'Question not found' });
    }

    const response = {
      question: question.question,
      answer: question.answer,
      image: question.image,
      relatedQuestions: question.relatedQuestions,
      relatedTopics: question.relatedTopics,
      subject: question.subject,
    };

    res.json(response);
  } catch (error) {
    console.error('Error retrieving question:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const searchByQuestion = async (req, res) => {
  try {
    const searchText = req.body.question;

    if (!searchText) {
      return res.status(400).json({ message: 'Search text is required' });
    }

    let questions = await Question.find({
      question: { $regex: searchText, $options: 'i' },
    }).sort({ timestamp: -1 });

    if (questions.length === 0) {
      // Search for the most similar question using fuzzy string matching
      const fuseOptions = {
        keys: ['question'],
        threshold: 0.6, // Adjust the threshold as needed
      };

      questions = await Question.find();
      const fuse = new Fuse(questions, fuseOptions);
      const fuzzyResults = fuse.search(searchText);

      if (fuzzyResults.length > 0) {
        const mostSimilarQuestion = fuzzyResults[0].item;

        const responseMessage = `No questions found for the specified text. Did you mean: "${mostSimilarQuestion.question}"?`;

        const suggestions = [
          {
            question: mostSimilarQuestion.question,
            relatedTopics: mostSimilarQuestion.relatedTopics,
            subject: mostSimilarQuestion.subject,
          },
        ];

        return res.status(404).json({ message: responseMessage, suggestions });
      }

      return res.status(404).json({ message: 'No questions found for the specified text' });
    }

    let responseMessage = 'Questions found';
    res.json({ message: responseMessage, questions });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ message: 'Invalid JSON format in request body' });
    }

    console.error('Error searching questions by text:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addQuestion = async (req, res) => {
  const {
    question,
    answer,
    image,
    relatedQuestions,
    relatedTopics,
    subject,
  } = req.body;

  try {
    const existingQuestion = await Question.findOne({ question });

    if (existingQuestion) {
      const response = {
        question: existingQuestion.question,
        answer: existingQuestion.answer,
        image: existingQuestion.image,
        relatedQuestions: existingQuestion.relatedQuestions,
        relatedTopics: existingQuestion.relatedTopics,
        subject: existingQuestion.subject,
      };
      return res.status(400).json({
        message: 'Question already exists',
        existingQuestion: response,
      });
    }

    const newQuestion = new Question({
      question,
      answer,
      image,
      relatedQuestions,
      relatedTopics,
      subject,
    });

    await newQuestion.save();
    res.json({ message: 'Question added successfully' });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ message: 'Failed to add question' });
  }
};

const listQuestions = async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (error) {
    console.error('Error retrieving questions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find();

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found' });
    }

    res.json(questions);
  } catch (error) {
    console.error('Error retrieving questions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const searchAnswerByQuestionText = async (req, res) => {
  const questionText = req.query.text;

  try {
    const existingQuestion = await Question.findOne({ question: questionText });

    if (existingQuestion) {
      const response = {
        question: existingQuestion.question,
        answer: existingQuestion.answer,
        image: existingQuestion.image,
        relatedQuestions: existingQuestion.relatedQuestions,
        relatedTopics: existingQuestion.relatedTopics,
        subject: existingQuestion.subject,
      };
      return res.status(200).json(response);
    } else {
      return res.status(404).json({ message: 'Question not found' });
    }
  } catch (error) {
    console.error('Error searching for question:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const searchQuestion = async (req, res) => {
  const searchText = req.body.question;

  try {
    if (!searchText) {
      return res.status(400).json({ message: 'Search text is required' });
    }

    const similarQuestions = await Question.find({
      question: { $regex: searchText, $options: 'i' }, // Case-insensitive search
    });

    const exactAnswers = await Question.find({ answer: searchText });

    const response = {
      similarQuestions,
      exactAnswers,
    };

    res.json(response);
  } catch (error) {
    console.error('Error searching questions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const searchByTopic = async (req, res) => {
  try {
    const topic = req.body.topic;
    if (!topic) {
      return res.status(400).json({ message: 'Search topic is required' });
    }

    let questions = await Question.find({
      relatedTopics: { $regex: topic, $options: 'i' },
    }).sort({ timestamp: -1 });

    if (questions.length === 0) {
      questions = await Question.find({
        subject: { $regex: topic, $options: 'i' },
      }).sort({ timestamp:-1  });
      if (questions.length === 0) {
        return res.status(404).json({ message: 'No questions found for the specified topic or subject' });
      }
    }

    let responseMessage = 'Questions found';
    if (questions.length > 0 && questions[0].subject) {
      responseMessage += ` in the subject: ${questions[0].subject}`;
    }

    res.json({ message: responseMessage, questions });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ message: 'Invalid JSON format in request body' });
    }

    console.error('Error searching questions by topic:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const searchBySubject = async (req, res) => {
  try {
    const subject = req.body.subject;
    if (!subject) {
      return res.status(400).json({ message: 'Search subject is required' });
    }

    let questions = await Question.find({
      subject: { $regex: subject, $options: 'i' },
    }).sort({ timestamp: -1 });

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for the specified subject' });
    }

    let responseMessage = 'Questions found';
    if (questions.length > 0) {
      responseMessage += ` in the subject: ${subject}`;
    }

    res.json({ message: responseMessage, questions });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ message: 'Invalid JSON format in request body' });
    }

    console.error('Error searching questions by subject:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// const searchByTopicOrSubject = async (req, res) => {
//   try {
//     const { topic, subject } = req.body;

//     if (!topic && !subject) {
//       return res.status(400).json({ message: 'Search topic or subject is required' });
//     }

//     let query = {};
//     if (topic) {
//       query.relatedTopics = { $regex: topic, $options: 'i' };
//     }
//     if (subject) {
//       query.subject = { $regex: subject, $options: 'i' };
//     }

//     let questions = await Question.find(query).sort({ timestamp: -1 });

//     if (questions.length === 0) {
//       // Search for the most similar question in the topic or subject
//       const mostSimilarQuestion = await Question.findOne({
//         $or: [
//           { question: { $regex: topic || subject, $options: 'i' } },
//           { subject: { $regex: topic || subject, $options: 'i' } }
//         ]
//       }).sort({ timestamp: -1 });

//       if (mostSimilarQuestion) {
//         const responseMessage = `No questions found for the specified topic or subject. Did you mean: "${mostSimilarQuestion.question}" in the topic: "${mostSimilarQuestion.relatedTopics}" or subject: "${mostSimilarQuestion.subject}"?`;

//         const suggestions = [
//           {
//             question: mostSimilarQuestion.question,
//             relatedTopics: mostSimilarQuestion.relatedTopics,
//             subject: mostSimilarQuestion.subject
//           }
//         ];

//         return res.status(404).json({ message: responseMessage, suggestions });
//       }

//       return res.status(404).json({ message: 'No questions found for the specified topic or subject' });
//     }

//     let responseMessage = 'Questions found';
//     if (questions.length > 0) {
//       if (topic && subject) {
//         responseMessage += ` in the topic: ${topic} and subject: ${subject}`;
//       } else if (topic) {
//         responseMessage += ` in the topic: ${topic}`;
//       } else if (subject) {
//         responseMessage += ` in the subject: ${subject}`;
//       }
//     }

//     res.json({ message: responseMessage, questions });
//   } catch (error) {
//     if (error instanceof SyntaxError) {
//       return res.status(400).json({ message: 'Invalid JSON format in request body' });
//     }

//     console.error('Error searching questions by topic or subject:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

const searchByTopicOrSubject = async (req, res) => {
  try {
    const { topic, subject } = req.body;

    if (!topic && !subject) {
      return res.status(400).json({ message: 'Search topic or subject is required' });
    }

    let query = {};
    if (topic) {
      query.relatedTopics = { $regex: topic, $options: 'i' };
    }
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    let questions = await Question.find(query).sort({ timestamp: -1 });

    if (questions.length === 0) {
      // Search for the most similar question using fuzzy string matching
      const fuseOptions = {
        keys: ['question', 'subject', 'relatedTopics'],
        threshold: 0.6, // Adjust the threshold as needed
      };

      questions = await Question.find();
      const fuse = new Fuse(questions, fuseOptions);
      const fuzzyResults = fuse.search(topic || subject);

      if (fuzzyResults.length > 0) {
        const mostSimilarQuestion = fuzzyResults[0].item;

        let responseMessage = '';
        if (mostSimilarQuestion) {
          if (mostSimilarQuestion.relatedTopics && topic) {
            responseMessage = `No questions found for the specified topic. Did you mean: "${mostSimilarQuestion.question}" in the topic: "${mostSimilarQuestion.relatedTopics}"?`;
          } else if (mostSimilarQuestion.subject && subject) {
            responseMessage = `No questions found for the specified subject. Did you mean: "${mostSimilarQuestion.question}" in the subject: "${mostSimilarQuestion.subject}"?`;
          }
        }
        const suggestions = [
          {
            question: mostSimilarQuestion.question,
            relatedTopics: mostSimilarQuestion.relatedTopics,
            subject: mostSimilarQuestion.subject,
          },
        ];

        return res.status(404).json({ message: responseMessage, suggestions });
      }

      return res.status(404).json({ message: 'No questions found for the specified topic or subject' });
    }

    let responseMessage = 'Questions found';
    if (questions.length > 0) {
      if (topic && subject) {
        responseMessage += ` in the topic: ${topic} and subject: ${subject}`;
      } else if (topic) {
        responseMessage += ` in the topic: ${topic}`;
      } else if (subject) {
        responseMessage += ` in the subject: ${subject}`;
      }
    }

    res.json({ message: responseMessage, questions });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ message: 'Invalid JSON format in request body' });
    }

    console.error('Error searching questions by topic or subject:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



module.exports = {
  getQuestion,
  addQuestion,
  listQuestions,
  getAllQuestions,
  searchAnswerByQuestionText,
  searchQuestion,
  searchByTopic,
  searchBySubject,
  searchByTopicOrSubject,
  searchByQuestion,
};
