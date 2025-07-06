export interface SkillLevel {
  name: string;
  order: number;
  description?: string;
  color: string; // Hex color code for this skill level
}

export interface SportSkillLevels {
  [sport: string]: SkillLevel[];
}

export const SKILL_LEVELS: SportSkillLevels = {
  'Badminton': [
    { name: 'Low Beginner', order: 1, description: 'Just for fun, learning basics', color: '#10b981' },
    { name: 'Mid Beginner', order: 2, description: 'Know basic rules and strokes', color: '#3b82f6' },
    { name: 'High Beginner', order: 3, description: 'Consistent rallies, good technique', color: '#3b82f6' },
    { name: 'Low Intermediate', order: 4, description: 'Powerful smash, good backhand', color: '#f59e0b' },
    { name: 'Advanced', order: 5, description: 'Strong tactical play, tournament level', color: '#ef4444' },
    { name: 'Expert', order: 6, description: 'Professional player, advanced techniques', color: '#8b5cf6' },
  ],
  'Tennis': [
    { name: 'Beginner', order: 1, description: 'Learning basic strokes and rules', color: '#10b981' },
    { name: 'Intermediate', order: 2, description: 'Can rally consistently', color: '#3b82f6' },
    { name: 'Advanced', order: 3, description: 'Strong groundstrokes and serves', color: '#f59e0b' },
    { name: 'Tournament', order: 4, description: 'Competitive tournament player', color: '#ef4444' },
    { name: 'Professional', order: 5, description: 'High-level competitive play', color: '#8b5cf6' },
  ],
  'Basketball': [
    { name: 'Casual', order: 1, description: 'Just for fun and exercise', color: '#10b981' },
    { name: 'Recreational', order: 2, description: 'Know basic rules and shooting', color: '#3b82f6' },
    { name: 'Intermediate', order: 3, description: 'Good fundamentals and teamwork', color: '#f59e0b' },
    { name: 'Competitive', order: 4, description: 'League or tournament experience', color: '#ef4444' },
    { name: 'Elite', order: 5, description: 'High-level competitive player', color: '#8b5cf6' },
  ],
  'Table Tennis': [
    { name: 'Beginner', order: 1, description: 'Learning basic strokes', color: '#10b981' },
    { name: 'Recreational', order: 2, description: 'Can play basic rallies', color: '#3b82f6' },
    { name: 'Intermediate', order: 3, description: 'Good spin and placement', color: '#f59e0b' },
    { name: 'Advanced', order: 4, description: 'Tournament level play', color: '#ef4444' },
    { name: 'Expert', order: 5, description: 'Competitive club player', color: '#8b5cf6' },
  ],
  'Squash': [
    { name: 'Beginner', order: 1, description: 'Learning court movement and basic shots', color: '#10b981' },
    { name: 'Recreational', order: 2, description: 'Can maintain rallies', color: '#3b82f6' },
    { name: 'Intermediate', order: 3, description: 'Good court coverage and shot variety', color: '#f59e0b' },
    { name: 'Advanced', order: 4, description: 'Strong tactical awareness', color: '#ef4444' },
    { name: 'Expert', order: 5, description: 'Competitive league player', color: '#8b5cf6' },
  ],
  'Volleyball': [
    { name: 'Beginner', order: 1, description: 'Learning basic skills', color: '#10b981' },
    { name: 'Recreational', order: 2, description: 'Can serve and pass', color: '#3b82f6' },
    { name: 'Intermediate', order: 3, description: 'Good team coordination', color: '#f59e0b' },
    { name: 'Competitive', order: 4, description: 'League or tournament play', color: '#ef4444' },
    { name: 'Elite', order: 5, description: 'High-level competitive player', color: '#8b5cf6' },
  ],
  'Football': [
    { name: 'Casual', order: 1, description: 'Just for fun and fitness', color: '#10b981' },
    { name: 'Recreational', order: 2, description: 'Know basic rules and skills', color: '#3b82f6' },
    { name: 'Intermediate', order: 3, description: 'Good ball control and passing', color: '#f59e0b' },
    { name: 'Competitive', order: 4, description: 'League or club experience', color: '#ef4444' },
    { name: 'Elite', order: 5, description: 'High-level competitive player', color: '#8b5cf6' },
  ],
  'Swimming': [
    { name: 'Beginner', order: 1, description: 'Learning basic strokes', color: '#10b981' },
    { name: 'Recreational', order: 2, description: 'Can swim multiple strokes', color: '#3b82f6' },
    { name: 'Intermediate', order: 3, description: 'Good technique and endurance', color: '#f59e0b' },
    { name: 'Advanced', order: 4, description: 'Competitive swimming experience', color: '#ef4444' },
    { name: 'Elite', order: 5, description: 'High-level competitive swimmer', color: '#8b5cf6' },
  ],
  'Running': [
    { name: 'Beginner', order: 1, description: 'Starting running journey', color: '#10b981' },
    { name: 'Recreational', order: 2, description: 'Regular casual running', color: '#3b82f6' },
    { name: 'Intermediate', order: 3, description: 'Can run 5-10K comfortably', color: '#f59e0b' },
    { name: 'Advanced', order: 4, description: 'Half marathon and beyond', color: '#ef4444' },
    { name: 'Elite', order: 5, description: 'Competitive racing', color: '#8b5cf6' },
  ],
  'Cycling': [
    { name: 'Casual', order: 1, description: 'Leisure cycling', color: '#10b981' },
    { name: 'Recreational', order: 2, description: 'Regular short rides', color: '#3b82f6' },
    { name: 'Intermediate', order: 3, description: 'Long distance cycling', color: '#f59e0b' },
    { name: 'Advanced', order: 4, description: 'Competitive cycling', color: '#ef4444' },
    { name: 'Elite', order: 5, description: 'Racing and high performance', color: '#8b5cf6' },
  ],
  'Gym/Fitness': [
    { name: 'Beginner', order: 1, description: 'New to fitness training', color: '#10b981' },
    { name: 'Recreational', order: 2, description: 'Regular gym goer', color: '#3b82f6' },
    { name: 'Intermediate', order: 3, description: 'Good form and routine', color: '#f59e0b' },
    { name: 'Advanced', order: 4, description: 'Serious training goals', color: '#ef4444' },
    { name: 'Expert', order: 5, description: 'Competitive or professional level', color: '#8b5cf6' },
  ],
};

// Helper functions
export const getSkillLevelsForSport = (sport: string): SkillLevel[] => {
  return SKILL_LEVELS[sport] || [];
};

export const getSkillLevelColor = (levelName: string, sport: string): string => {
  const levels = getSkillLevelsForSport(sport);
  const level = levels.find(l => l.name === levelName);

  if (!level) return '#6b7280'; // Default gray

  // Return the specific color defined for this level
  return level.color;
};

// Check if a skill level falls within a range
export const isSkillLevelInRange = (
  targetLevel: string,
  rangeStart: string,
  rangeEnd: string,
  sport: string
): boolean => {
  const levels = getSkillLevelsForSport(sport);

  // Find the order values for each level
  const targetOrder = levels.find(l => l.name === targetLevel)?.order;
  const startOrder = levels.find(l => l.name === rangeStart)?.order;
  const endOrder = levels.find(l => l.name === rangeEnd)?.order;

  // If any level is not found, return false
  if (targetOrder === undefined || startOrder === undefined || endOrder === undefined) {
    return false;
  }

  // Check if target level falls within the range (inclusive)
  return targetOrder >= startOrder && targetOrder <= endOrder;
};

export const formatSkillLevelRange = (startLevel: string, endLevel: string): string => {
  if (startLevel === endLevel) {
    return startLevel;
  }
  return `${startLevel} - ${endLevel}`;
};
