import { test, expect } from "@playwright/test";
import { answerCurriculumDoubt, isQuestionRelevantToTopic } from "../src/lib/curriculum-answers";

test.describe("Query Resolver Topic Relevance & Persona Verification", () => {
  test("correctly identifies relevant vs irrelevant questions for 'The Human Cell'", () => {
    const topic = "The Human Cell";

    // Relevant questions
    expect(isQuestionRelevantToTopic("What does the nucleus do?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("Explain the cell membrane", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What is the function of mitochondria?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("Can you repeat what you just said?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What is on the board right now?", topic)).toBe(true);

    // Irrelevant / out-of-scope questions
    expect(isQuestionRelevantToTopic("Who won the cricket match yesterday?", topic)).toBe(false);
    expect(isQuestionRelevantToTopic("What is the weather in New York?", topic)).toBe(false);
    expect(isQuestionRelevantToTopic("Can you teach me trigonometry?", topic)).toBe(false);
    expect(isQuestionRelevantToTopic("Who is the prime minister?", topic)).toBe(false);
    expect(isQuestionRelevantToTopic("What is a recipe for chocolate cake?", topic)).toBe(false);
  });

  test("correctly identifies relevant vs irrelevant questions for 'Right Triangles & Trigonometry'", () => {
    const topic = "Right Triangles & Trigonometry";

    // Relevant questions
    expect(isQuestionRelevantToTopic("What is the hypotenuse?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("Explain Pythagorean theorem", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What is sine and cosine?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("Can you explain this part of the triangle again?", topic)).toBe(true);

    // Irrelevant / out-of-scope questions
    expect(isQuestionRelevantToTopic("What does the cell nucleus do?", topic)).toBe(false);
    expect(isQuestionRelevantToTopic("Who is playing in the IPL today?", topic)).toBe(false);
    expect(isQuestionRelevantToTopic("How to bake cookies?", topic)).toBe(false);
  });

  test("generates polite deferral and marks isIrrelevant: true for off-topic query", () => {
    const context = {
      topic: "The Human Cell",
      chapter: 1,
      chapterTitle: "Outer Membrane & Cytoplasm",
      timestamp: 25,
      caption: "The plasma membrane encloses the cell.",
    };

    // 1. English
    const offTopicResultEn = answerCurriculumDoubt("Who won the cricket match yesterday?", context, "en");
    expect(offTopicResultEn.isIrrelevant).toBe(true);
    expect(offTopicResultEn.explanation).toContain("That's an interesting question!");
    expect(offTopicResultEn.explanation).toContain("right now we're focusing on our lesson on The Human Cell");
    expect(offTopicResultEn.explanation).toContain("discuss that query after our class");
    expect(offTopicResultEn.explanation).toContain("resume and continue our lesson on the whiteboard");
    expect(offTopicResultEn.suggestions).toContain("Resume lecture");

    // 2. Hindi
    const offTopicResultHi = answerCurriculumDoubt("क्रिकेट मैच कौन जीता?", context, "hi");
    expect(offTopicResultHi.isIrrelevant).toBe(true);
    expect(offTopicResultHi.explanation).toContain("कक्षा समाप्त होने के बाद इस विषय पर ज़रूर चर्चा कर सकते हैं");
    expect(offTopicResultHi.explanation).toContain("व्हाइटबोर्ड पर अपने पाठ को आगे बढ़ाते हैं");

    // 3. Hinglish
    const offTopicResultHinglish = answerCurriculumDoubt("Kal cricket match kaun jeeta?", context, "hinglish");
    expect(offTopicResultHinglish.isIrrelevant).toBe(true);
    expect(offTopicResultHinglish.explanation).toContain("class khatam hone ke baad zaroor discuss kar sakte hain");
    expect(offTopicResultHinglish.explanation).toContain("whiteboard par apne lecture ko continue karte hain");
  });

  test("answers relevant questions accurately with pedagogical encouragement and doubt marks", () => {
    const context = {
      topic: "The Human Cell",
      chapter: 1,
      chapterTitle: "Outer Membrane & Cytoplasm",
      timestamp: 25,
      caption: "The plasma membrane encloses the cell.",
    };

    const relevantResult = answerCurriculumDoubt("What is the cell membrane?", context, "en");
    expect(relevantResult.isIrrelevant).toBe(false);
    expect(relevantResult.explanation).toContain("Notice the flexible outer boundary on our whiteboard");
    expect(relevantResult.explanation).toContain("cell membrane");
    expect(relevantResult.doubtMarks).toBeDefined();
    expect(relevantResult.doubtMarks!.length).toBeGreaterThan(0);
  });
});
