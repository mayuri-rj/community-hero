export const DEPARTMENTS = [
  'Civil & Environmental Engineering',
  'Healthcare & Medical Sciences',
  'Education & Social Sciences',
  'Agricultural Sciences',
  'Computer Science & IT',
  'General/Multidisciplinary',
];

export const CATEGORY_TO_DEPT = {
  'Pothole': 'Civil & Environmental Engineering',
  'Garbage/Waste': 'Civil & Environmental Engineering',
  'Broken Streetlight': 'Civil & Environmental Engineering',
  'Water Leakage': 'Civil & Environmental Engineering',
  'Damaged Road': 'Civil & Environmental Engineering',
  'Encroachment': 'Civil & Environmental Engineering',
  'Healthcare Issue': 'Healthcare & Medical Sciences',
  'Education Issue': 'Education & Social Sciences',
  'Agriculture/Rural Issue': 'Agricultural Sciences',
  'Digital Accessibility Issue': 'Computer Science & IT',
  'Other': 'General/Multidisciplinary',
};

// Given an issue's aiCategory, return its matching department
export const getDeptForCategory = (category) => {
  return CATEGORY_TO_DEPT[category] || 'General/Multidisciplinary';
};