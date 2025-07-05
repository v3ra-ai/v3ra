# Tomorrow's Headlines Feature

## Overview
Tomorrow's Headlines is a daily prediction game that gamifies AI accuracy verification. Users predict whether specific news events will happen in the next 24 hours, creating valuable data about AI prediction capabilities.

## Current Implementation (MVP)

### User Flow
1. Users visit `/headlines` once per day
2. They see 3 news predictions with AI consensus percentages
3. Users swipe right (YES) or left (NO) on each prediction
4. After completing all 3, they earn 50 V3RA points
5. Streak tracking encourages daily participation

### Technical Details
- **Frontend**: `/app/headlines/page.tsx` - Swipe interface with Framer Motion animations
- **API**: `/app/api/headlines/daily/route.ts` - Generates daily predictions
- **Storage**: LocalStorage for streak tracking and daily completion
- **Integration**: Added to main Truth Market navigation tabs

### Design Decisions
- Maintained existing cyberpunk aesthetic with neon cyan/pink accents
- Used card-based swipe interface similar to dating apps
- Integrated with existing V3RA points system
- Added prominent banner in Truth Market to drive discovery

## Next Steps

### Immediate Priorities
1. **Connect to Prediction System**
   - Save headlines predictions to database
   - Link with existing prediction tracking infrastructure
   - Show results after 24 hours

2. **Real News Sources**
   - Integrate Reuters/AP APIs for verification
   - Implement automated resolution system
   - Track accuracy of both AI and users

3. **Enhanced Gamification**
   - Add leaderboards for best predictors
   - Create badges/achievements
   - Implement prediction betting with V3RA

### Future Enhancements
1. **Personalization**
   - Category preferences (tech, finance, politics)
   - Difficulty levels
   - Custom prediction times (6h, 12h, 24h)

2. **Social Features**
   - Share predictions
   - Challenge friends
   - Group predictions

3. **AI Model Comparison**
   - Show which models made which predictions
   - Track model accuracy over time
   - Create "AI vs Human" competitions

## Product Strategy
This feature serves as a simple entry point to the broader Truth Market vision:
- **Low friction**: 30-second daily interaction
- **Clear value**: Earn points, track accuracy
- **Viral potential**: Streaks create social sharing moments
- **Data generation**: Creates training data for AI truthfulness

The goal is to achieve 40% day-2 retention, indicating product-market fit before expanding features.