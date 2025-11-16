export interface DesignPrompt {
  id: string;
  title: string;
  category: 'improve-existing' | 'new-product' | 'accessibility' | 'business-metric' | 'mobile-app' | 'constraint-based';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  company?: string;
  prompt: string;
  timeAllocation?: {
    discovery: number;
    headsDown: number;
    presentation: number;
  };
}

export const DESIGN_PROMPTS: DesignPrompt[] = [
  {
    id: 'food-delivery-offline',
    title: 'Food Delivery - Dietary Restrictions (Offline)',
    category: 'constraint-based',
    difficulty: 'advanced',
    prompt: `Design a feature for a food delivery app that helps users manage their dietary restrictions and allergies.

Strong constraint: The feature must work entirely offline after initial setup.

Consider:
- How users discover and set up their restrictions
- How the feature surfaces safe menu items
- Edge cases (cross-contamination, unclear ingredients)
- Metrics to track success`,
  },
  {
    id: 'alarm-clock-blind',
    title: 'Alarm Clock for the Blind',
    category: 'accessibility',
    difficulty: 'advanced',
    company: 'Google (Common)',
    prompt: `Design an alarm clock specifically for blind users.

Consider:
- How users set and manage alarms without visual feedback
- What makes waking up different for blind users
- How the alarm provides context (time, weather, calendar)
- Interaction patterns that work without sight
- Accessibility beyond just screen readers`,
  },
  {
    id: 'parking-finder',
    title: 'Parking Finder App',
    category: 'mobile-app',
    difficulty: 'intermediate',
    company: 'Uber (Common)',
    prompt: `Design an app that helps people find parking in a crowded city.

Consider:
- How users discover available spots in real-time
- Payment and reservation flows
- Navigation to the parking spot
- What happens when spots are taken before arrival
- Metrics: Utilization rate, time to find parking`,
  },
  {
    id: 'doctor-appointment',
    title: 'Improve Doctor Appointment Booking',
    category: 'improve-existing',
    difficulty: 'beginner',
    company: 'Oscar Health, Zocdoc',
    prompt: `Improve the experience of booking a doctor's appointment online.

Consider:
- Current pain points in the booking process
- How users choose the right doctor
- Insurance verification flow
- Rescheduling and cancellation
- Reminder systems
- Metrics: Booking completion rate, no-show reduction`,
  },
  {
    id: 'atm-redesign',
    title: 'Redesign the ATM',
    category: 'improve-existing',
    difficulty: 'intermediate',
    company: 'Banking/FinTech',
    prompt: `Redesign the ATM experience for 2025.

Consider:
- Current pain points with ATMs
- Security vs convenience trade-offs
- Mobile integration opportunities
- Accessibility for elderly and disabled users
- Future of cash in digital age
- Error states and failed transactions`,
  },
  {
    id: 'linkedin-freelance',
    title: 'LinkedIn Freelance Marketplace',
    category: 'new-product',
    difficulty: 'advanced',
    company: 'LinkedIn',
    prompt: `LinkedIn has decided to build a marketplace for freelancers. Design the hiring flow.

Consider:
- How companies discover and vet freelancers
- How freelancers showcase their work
- Proposal and bidding system
- Contract and payment flows
- Trust and safety mechanisms
- Metrics: Match quality, time to hire`,
  },
  {
    id: 'car-locator',
    title: 'Employee Car Locator',
    category: 'mobile-app',
    difficulty: 'beginner',
    prompt: `Design a car locator feature for employees who frequently lose their cars in large company parking lots.

Consider:
- How the system identifies car location
- User flow when arriving vs leaving
- What if GPS isn't accurate in parking structures
- Multiple parking lots/levels
- Integration with existing badge systems`,
  },
  {
    id: 'public-transport',
    title: 'Redesign City Public Transport System',
    category: 'improve-existing',
    difficulty: 'advanced',
    company: 'Transit App, Citymapper',
    prompt: `Redesign your city's public transport experience (app + physical).

Consider:
- Journey planning across multiple transport modes
- Real-time updates and delays
- Payment and ticketing
- Accessibility for tourists vs locals
- Physical touchpoints (stations, signage)
- Metrics: Ridership increase, user satisfaction`,
  },
  {
    id: 'video-watch-party',
    title: 'Social Video Watching Experience',
    category: 'new-product',
    difficulty: 'intermediate',
    company: 'Netflix, Disney+',
    prompt: `Design a feature that lets friends watch videos together remotely.

Strong constraint: Must work across different time zones and schedules.

Consider:
- Synchronous vs asynchronous watching
- Communication while watching
- Handling different viewing speeds
- Privacy and permissions
- Metrics: Engagement time, retention`,
  },
  {
    id: 'elderly-smartphone',
    title: 'Smartphone Interface for Elderly Users',
    category: 'accessibility',
    difficulty: 'intermediate',
    prompt: `Design a smartphone home screen and core apps optimized for users 70+.

Consider:
- Common pain points elderly users face
- Vision, hearing, and motor skill accommodations
- Simplified vs condescending design
- Emergency features and caregiver access
- Teaching new users
- Maintaining dignity and independence`,
  },
  {
    id: 'restaurant-waitlist',
    title: 'Restaurant Waitlist System',
    category: 'new-product',
    difficulty: 'beginner',
    company: 'Yelp, OpenTable',
    prompt: `Design a digital waitlist system for restaurants.

Consider:
- How diners join the waitlist
- Wait time estimation accuracy
- Notification system when table is ready
- No-show prevention
- Restaurant host dashboard
- Metrics: Table turnover time, customer satisfaction`,
  },
  {
    id: 'sustainable-shopping',
    title: 'Sustainable Shopping Tracker',
    category: 'mobile-app',
    difficulty: 'intermediate',
    prompt: `Design an app that helps users make more sustainable shopping choices.

Consider:
- How to measure and display environmental impact
- Barcode scanning and product lookup
- Alternative product suggestions
- Balancing sustainability with cost
- Gamification and behavior change
- Avoiding eco-shaming
- Metrics: Behavior change, carbon saved`,
  },
  {
    id: 'home-workout',
    title: 'Home Workout Coaching App',
    category: 'mobile-app',
    difficulty: 'intermediate',
    company: 'Peloton, Apple Fitness',
    prompt: `Design a home workout app with AI coaching.

Strong constraint: Must work without any special equipment.

Consider:
- Personalization and skill levels
- Form correction without sensors
- Motivation and streaks
- Space constraints in small apartments
- Privacy concerns with camera
- Metrics: Completion rate, retention`,
  },
  {
    id: 'group-expense-split',
    title: 'Group Expense Splitting',
    category: 'improve-existing',
    difficulty: 'beginner',
    company: 'Splitwise, Venmo',
    prompt: `Improve the experience of splitting expenses in group trips.

Consider:
- Capturing expenses as they happen
- Handling different currencies
- Unequal splits and complex scenarios
- Settlement and payment
- Trust and transparency
- Minimizing awkwardness around money`,
  },
  {
    id: 'air-quality-alerts',
    title: 'Hyperlocal Air Quality Alerts',
    category: 'mobile-app',
    difficulty: 'advanced',
    prompt: `Design an air quality monitoring system that provides hyperlocal alerts.

Consider:
- Data sources and accuracy
- When and how to alert users
- Recommendations for different air quality levels
- Special considerations for children, elderly, asthmatics
- Indoor vs outdoor air quality
- Long-term health tracking
- Metrics: Alert accuracy, behavior change`,
  },
];

export function getPromptById(id: string): DesignPrompt | undefined {
  return DESIGN_PROMPTS.find((p) => p.id === id);
}

export function getPromptsByCategory(category: DesignPrompt['category']): DesignPrompt[] {
  return DESIGN_PROMPTS.filter((p) => p.category === category);
}

export function getPromptsByDifficulty(difficulty: DesignPrompt['difficulty']): DesignPrompt[] {
  return DESIGN_PROMPTS.filter((p) => p.difficulty === difficulty);
}
