export const sampleFlashcardDeck = {
  title: 'JavaScript Fundamentals',
  subject: 'JavaScript',
  description: 'Essential JavaScript concepts',
  is_public: false,
  cards: [
    {
      front: 'What is a variable in JavaScript?',
      back: 'A variable is a container for storing data values. In JavaScript, variables can be declared using var, let, or const.',
      difficulty: 'easy'
    },
    {
      front: 'Explain the difference between let and const',
      back: 'let allows reassignment of values, while const creates a read-only reference. const must be initialized at declaration.',
      difficulty: 'medium'
    },
    {
      front: 'What is hoisting?',
      back: 'Hoisting is JavaScript\'s behavior of moving declarations to the top of their scope before code execution. Variables and functions can be used before they are declared.',
      difficulty: 'hard'
    }
  ]
};

export const reactDeck = {
  title: 'React Hooks',
  subject: 'React',
  description: 'Master React hooks',
  is_public: true,
  cards: [
    {
      front: 'What is the purpose of useState?',
      back: 'useState is a Hook that lets you add state to functional components. It returns an array with the current state and a function to update it.',
      difficulty: 'easy'
    },
    {
      front: 'When should you use useEffect?',
      back: 'useEffect is for side effects in functional components - data fetching, subscriptions, manual DOM updates. It runs after render.',
      difficulty: 'medium'
    }
  ]
};

export const publicDeck = {
  title: 'HTML Tags',
  subject: 'HTML',
  description: 'Common HTML tags and their usage',
  is_public: true,
  cards: [
    {
      front: 'What is the <div> tag used for?',
      back: 'The <div> tag is a container element used to group other HTML elements and apply styles or JavaScript functionality.',
      difficulty: 'easy'
    }
  ]
};
