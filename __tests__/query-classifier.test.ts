import { QueryClassifier } from "@/lib/services/query-classifier";
import { QueryCategory } from "@/lib/types/query-classifier";

describe("QueryClassifier", () => {
  let classifier: QueryClassifier;

  beforeEach(() => {
    classifier = new QueryClassifier();
  });

  describe("Fact Check Classification", () => {
    it("should classify factual statements", () => {
      const testCases = [
        "The Earth is flat",
        "Paris is the capital of France",
        "Water boils at 100 degrees Celsius",
        "The sun revolves around the Earth",
      ];

      testCases.forEach(query => {
        const result = classifier.classify(query);
        expect(result.category).toBe(QueryCategory.FACT_CHECK);
        expect(result.confidence).toBeGreaterThan(0.6);
      });
    });
  });

  describe("Question & Answer Classification", () => {
    it("should classify questions correctly", () => {
      const testCases = [
        "What is the capital of France?",
        "How does photosynthesis work?",
        "When was World War II?",
        "Why is the sky blue?",
      ];

      testCases.forEach(query => {
        const result = classifier.classify(query);
        expect(result.category).toBe(QueryCategory.QUESTION_ANSWER);
        expect(result.confidence).toBeGreaterThan(0.6);
      });
    });
  });

  describe("Identity & Philosophy Classification", () => {
    it("should classify philosophical questions", () => {
      const testCases = [
        "Who am I?",
        "What is the meaning of life?",
        "tôi là ai", // Vietnamese: "Who am I?"
        "What is consciousness?",
        "What is the purpose of existence?",
      ];

      testCases.forEach(query => {
        const result = classifier.classify(query);
        expect(result.category).toBe(QueryCategory.IDENTITY_PHILOSOPHY);
      });
    });
  });

  describe("Current Events Classification", () => {
    it("should classify current event queries", () => {
      const testCases = [
        "What happened today in the news?",
        "Latest updates on the election",
        "Current COVID-19 statistics",
        "What occurred in Gaza yesterday?",
      ];

      testCases.forEach(query => {
        const result = classifier.classify(query);
        expect(result.category).toBe(QueryCategory.CURRENT_EVENTS);
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });
  });

  describe("Opinion & Debate Classification", () => {
    it("should classify opinion-based queries", () => {
      const testCases = [
        "Is capitalism better than socialism?",
        "Should AI be regulated?",
        "What is the best programming language?",
        "Android vs iPhone: which is better?",
      ];

      testCases.forEach(query => {
        const result = classifier.classify(query);
        expect(result.category).toBe(QueryCategory.OPINION_DEBATE);
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle theological questions appropriately", () => {
      const query = "what is god the father, god the son and god the holy spirit";
      const result = classifier.classify(query);
      
      // This could be either Q&A or Philosophy
      expect([QueryCategory.QUESTION_ANSWER, QueryCategory.IDENTITY_PHILOSOPHY])
        .toContain(result.category);
    });

    it("should provide suggestions for ambiguous queries", () => {
      const query = "true or false";
      const result = classifier.classify(query);
      
      expect(result.suggestedRephrasing).toBeDefined();
    });

    it("should extract keywords correctly", () => {
      const query = "Is artificial intelligence dangerous for humanity?";
      const result = classifier.classify(query);
      
      expect(result.keywords).toBeDefined();
      expect(result.keywords).toContain("artificial");
      expect(result.keywords).toContain("intelligence");
    });
  });

  describe("Confidence Levels", () => {
    it("should have high confidence for clear cases", () => {
      const clearFactCheck = "The Earth orbits the Sun";
      const result = classifier.classify(clearFactCheck);
      
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it("should have lower confidence for ambiguous cases", () => {
      const ambiguous = "Is it true";
      const result = classifier.classify(ambiguous);
      
      expect(result.confidence).toBeLessThan(0.7);
    });
  });
});