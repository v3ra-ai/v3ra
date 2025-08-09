-- Deactivate existing technical questions instead of deleting
UPDATE blind_test_questions SET is_active = false WHERE is_active = true;

-- Insert fun, personality-revealing questions for GPT-4o vs GPT-5 comparison
INSERT INTO blind_test_questions (question_text, category, difficulty, is_active) VALUES
-- Creative & Fun
('If you could have dinner with any fictional character, who would it be and what would you talk about?', 'creative', 'easy', true),
('Write a haiku about coffee', 'creative', 'easy', true),
('Explain the internet to someone from the 1800s in 3 sentences', 'creative', 'medium', true),
('What''s the most creative excuse for being late to work?', 'creative', 'easy', true),
('If animals could talk, which would be the rudest and why?', 'creative', 'easy', true),

-- Quick Reasoning
('Would you rather fight 100 duck-sized horses or 1 horse-sized duck? Explain your strategy', 'reasoning', 'easy', true),
('Is a hot dog a sandwich? Make your case', 'reasoning', 'easy', true),
('Should pineapple go on pizza? Defend your position', 'reasoning', 'easy', true),
('What came first, the chicken or the egg? Give your best argument', 'reasoning', 'medium', true),
('If you could eliminate one day of the week, which would it be and why?', 'reasoning', 'easy', true),

-- Practical Advice
('What''s the best life advice you can give in exactly 10 words?', 'general', 'easy', true),
('How do you cure hiccups? Give your best method', 'general', 'easy', true),
('What''s the secret to making perfect scrambled eggs?', 'general', 'easy', true),
('How would you explain why the sky is blue to a 5-year-old?', 'general', 'easy', true),
('What''s the best way to win at rock, paper, scissors?', 'general', 'easy', true),

-- Personality & Opinion
('Is it better to be a night owl or early bird?', 'general', 'easy', true),
('What''s worse: stepping on LEGO or biting your tongue?', 'general', 'easy', true),
('Cats or dogs? Make your case in one paragraph', 'general', 'easy', true),
('What superpower would be the most inconvenient to have?', 'creative', 'easy', true),
('If you had to eat only one food for a month, what would it be?', 'general', 'easy', true),

-- Quick Wit
('Tell me a joke about programmers', 'creative', 'easy', true),
('What''s the weirdest food combination that actually works?', 'general', 'easy', true),
('If you were a vegetable, which one would you be and why?', 'creative', 'easy', true),
('What''s something that''s considered normal now but will seem weird in 100 years?', 'reasoning', 'medium', true),
('Convince me that Mondays are actually great', 'reasoning', 'medium', true),

-- Simple Explanations
('Explain cryptocurrency like I''m 10 years old', 'general', 'medium', true),
('What does "being an adult" mean in 3 bullet points?', 'general', 'easy', true),
('How do airplanes stay in the air? Keep it simple', 'general', 'medium', true),
('Why do we dream? Give a fun theory', 'reasoning', 'medium', true),
('What makes something funny?', 'reasoning', 'medium', true);

-- Update the count to ensure we have enough questions
UPDATE blind_test_sessions 
SET total_questions = 10 
WHERE status = 'in_progress';