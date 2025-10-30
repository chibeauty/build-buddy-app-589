export const sampleQuiz = {
  title: 'React Fundamentals Quiz',
  subject: 'React',
  difficulty: 'medium',
  description: 'Test your knowledge of React basics',
  questions: [
    {
      id: '1',
      question: 'What is JSX?',
      type: 'multiple_choice',
      options: [
        'A JavaScript extension syntax',
        'A CSS preprocessor',
        'A package manager',
        'A testing framework'
      ],
      correct_answer: 'A JavaScript extension syntax',
      explanation: 'JSX is a syntax extension for JavaScript that allows you to write HTML-like code in JavaScript files.'
    },
    {
      id: '2',
      question: 'React is a library, not a framework.',
      type: 'true_false',
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'React is indeed a library focused on building user interfaces, while frameworks like Angular provide more comprehensive solutions.'
    },
    {
      id: '3',
      question: 'Which hook is used to manage state in functional components?',
      type: 'multiple_choice',
      options: [
        'useEffect',
        'useState',
        'useContext',
        'useReducer'
      ],
      correct_answer: 'useState',
      explanation: 'useState is the primary hook for managing state in functional components.'
    }
  ]
};

export const advancedQuiz = {
  title: 'Advanced JavaScript Concepts',
  subject: 'JavaScript',
  difficulty: 'hard',
  questions: [
    {
      id: '1',
      question: 'What is a closure in JavaScript?',
      type: 'short_answer',
      correct_answer: 'A closure is a function that has access to variables in its outer scope even after the outer function has returned',
      explanation: 'Closures allow functions to access variables from an enclosing scope.'
    }
  ]
};

export const easyQuiz = {
  title: 'HTML Basics',
  subject: 'HTML',
  difficulty: 'easy',
  questions: [
    {
      id: '1',
      question: 'What does HTML stand for?',
      type: 'multiple_choice',
      options: [
        'HyperText Markup Language',
        'Home Tool Markup Language',
        'Hyperlinks and Text Markup Language',
        'High Tech Modern Language'
      ],
      correct_answer: 'HyperText Markup Language',
      explanation: 'HTML stands for HyperText Markup Language and is used to structure web content.'
    }
  ]
};
