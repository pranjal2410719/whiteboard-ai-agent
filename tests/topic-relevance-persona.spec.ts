import { test, expect } from "@playwright/test";
import { answerCurriculumDoubt, isQuestionRelevantToTopic } from "../src/lib/curriculum-answers";

test.describe("Query Resolver Topic Relevance & Persona Verification", () => {
  test("correctly identifies relevant vs irrelevant questions for 'The Human Cell'", () => {
    const topic = "The Human Cell";

    // Relevant questions - Core concepts
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

  test("accurately verifies screen, whiteboard diagram, and visual elements", () => {
    const topic = "The Human Cell";

    // Diagram & screen visual references
    expect(isQuestionRelevantToTopic("What is that green border?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("Explain the diagram on the screen", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What does the illustration on the whiteboard show?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("Why is there a red circle in the center?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What is written next to number 3?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("Explain bullet point 4: Protein Factory", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What is the arrow pointing to?", topic)).toBe(true);
  });

  test("accurately recognizes diagram terms, regions, and organelles", () => {
    const topic = "The Human Cell";

    // Specific diagram organelle terms
    expect(isQuestionRelevantToTopic("What is the Golgi apparatus?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("Explain rough ER and ribosomes", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What are cristae in the mitochondria?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What does the cytoplasm do?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("How do transport vesicles work?", topic)).toBe(true);
  });

  test("accurately recognizes broader concepts taught or to be taught in class", () => {
    const topic = "The Human Cell";

    // Surrounding concepts & curriculum progression
    expect(isQuestionRelevantToTopic("How is a plant cell different from an animal cell?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("Does this cell have a cell wall or chloroplast?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What will we learn in the next slide?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("Can you recap what was covered in the previous part?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What is the agenda for this class?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("How does ATP synthase produce energy?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("How do nutrients cross the lipid bilayer?", topic)).toBe(true);
  });

  test("dynamically extracts terms from active whiteboard marks and regions", () => {
    const context = {
      topic: "Custom Science Class",
      currentMarks: [
        { type: "text" as const, text: "Photosynthesis Light Reactions: Chlorophyll absorbs photon", x: 10, y: 10 },
        { type: "image" as const, src: "/sample.png", alt: "Thylakoid Membrane Diagram", x: 100, y: 100, w: 200, h: 200 }
      ],
      currentRegions: [
        { id: "chlorophyll", label: "Chlorophyll P680", aliases: ["reaction center", "p680 pigment"] }
      ]
    };

    // Should match terms from marks
    expect(isQuestionRelevantToTopic("What does chlorophyll absorb?", context)).toBe(true);
    expect(isQuestionRelevantToTopic("Explain the thylakoid diagram", context)).toBe(true);
    expect(isQuestionRelevantToTopic("What is reaction center P680?", context)).toBe(true);

    // Completely off-topic should still fail
    expect(isQuestionRelevantToTopic("Who won the IPL match today?", context)).toBe(false);
    expect(isQuestionRelevantToTopic("How to make pizza?", context)).toBe(false);
  });

  test("correctly identifies relevant vs irrelevant questions for 'Right Triangles & Trigonometry'", () => {
    const topic = "Right Triangles & Trigonometry";

    // Relevant questions
    expect(isQuestionRelevantToTopic("What is the hypotenuse?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("Explain Pythagorean theorem", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What is sine and cosine?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("Can you explain this part of the triangle again?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What does angle theta represent on the board?", topic)).toBe(true);
    expect(isQuestionRelevantToTopic("What is written on the bottom side of the triangle?", topic)).toBe(true);

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

  test("answers relevant visual & whiteboard questions accurately with pedagogical encouragement", () => {
    const context = {
      topic: "The Human Cell",
      chapter: 1,
      chapterTitle: "Outer Membrane & Cytoplasm",
      timestamp: 25,
      caption: "The plasma membrane encloses the cell.",
    };

    // 1. Cell membrane
    const memResult = answerCurriculumDoubt("What is the cell membrane?", context, "en");
    expect(memResult.isIrrelevant).toBe(false);
    expect(memResult.explanation).toContain("Notice the flexible outer boundary on our whiteboard");
    expect(memResult.doubtMarks).toBeDefined();

    // 2. Green border visual inquiry
    const borderResult = answerCurriculumDoubt("What is that green border?", context, "en");
    expect(borderResult.isIrrelevant).toBe(false);
    expect(borderResult.explanation).toContain("green border");
    expect(borderResult.explanation).toContain("cell membrane");

    // 3. Diagram overview inquiry
    const diagramResult = answerCurriculumDoubt("What is the diagram showing?", context, "en");
    expect(diagramResult.isIrrelevant).toBe(false);
    expect(diagramResult.explanation).toContain("diagram");

    // 4. Item 4: Protein Factory inquiry
    const factoryResult = answerCurriculumDoubt("Explain bullet 4: Protein Factory", context, "en");
    expect(factoryResult.isIrrelevant).toBe(false);
    expect(factoryResult.explanation).toContain("Protein Factory");

    // 5. Golgi apparatus inquiry
    const golgiResult = answerCurriculumDoubt("What does the Golgi apparatus do?", context, "en");
    expect(golgiResult.isIrrelevant).toBe(false);
    expect(golgiResult.explanation).toContain("Golgi apparatus");

    // 6. Cristae inquiry
    const cristaeResult = answerCurriculumDoubt("What are cristae?", context, "en");
    expect(cristaeResult.isIrrelevant).toBe(false);
    expect(cristaeResult.explanation).toContain("cristae");

    // 7. Plant cell comparison inquiry
    const plantResult = answerCurriculumDoubt("Do plant cells have a cell wall?", context, "en");
    expect(plantResult.isIrrelevant).toBe(false);
    expect(plantResult.explanation).toContain("plant cell");

    // 8. Progress / agenda inquiry
    const nextResult = answerCurriculumDoubt("What will we learn in the next slide?", context, "en");
    expect(nextResult.isIrrelevant).toBe(false);
    expect(nextResult.explanation).toContain("lesson");
  });
});
