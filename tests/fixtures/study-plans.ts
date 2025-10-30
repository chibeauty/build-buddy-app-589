export const sampleStudyPlan = {
  title: 'Web Development Fundamentals',
  subject: 'Web Development',
  goal_type: 'skill',
  duration_weeks: 8,
  weekly_hours: 10,
  description: 'Learn the basics of web development',
  schedule: {
    weeks: [
      {
        week_number: 1,
        topic: 'HTML & CSS Basics',
        sessions: [
          {
            day: 1,
            topic: 'Introduction to HTML',
            duration_minutes: 60,
            activities: ['Read documentation', 'Watch tutorial', 'Practice exercises']
          },
          {
            day: 2,
            topic: 'HTML Elements and Structure',
            duration_minutes: 60,
            activities: ['Build simple webpage', 'Complete quiz']
          }
        ]
      }
    ]
  }
};

export const examPrepPlan = {
  title: 'React Certification Prep',
  subject: 'React',
  goal_type: 'certification',
  duration_weeks: 12,
  weekly_hours: 15,
  exam_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
  description: 'Prepare for React certification exam'
};

export const shortTermPlan = {
  title: 'Quick Python Basics',
  subject: 'Python',
  goal_type: 'exam',
  duration_weeks: 4,
  weekly_hours: 8,
  description: 'Learn Python fundamentals quickly'
};
