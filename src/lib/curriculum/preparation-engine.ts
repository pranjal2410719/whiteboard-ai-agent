import type { BoardMark, BoardPage, ChatMessage, DiagramRegion, SessionData } from "../types";
import { CanvasAssetRegistry } from "../canvas-intelligence/registry";
import { transformGeometry } from "../canvas-intelligence/geometry";
import type { AssetCanvasMap } from "../canvas-intelligence/types";
import { diagrams, isDiagramKey } from "../diagrams";
import { CurriculumTaxonomy } from "./taxonomy";
import type { ClassroomContext, PreparationRequest, PreparationResult, StudentLevel } from "./types";

const ink = "#293b32", green = "#3b805c", blue = "#507aaf", orange = "#bc7948", purple = "#8a6a9e";

export class PreparationEngine {
  /**
   * Prepares the full classroom context, pre-rendered diagram assets, learning objectives,
   * and structured session data for a live topic class.
   */
  static prepareClassroom(req: PreparationRequest): PreparationResult {
    const rawTopic = (req.topic || req.topicId || "").trim();
    const studentLevel: StudentLevel = req.studentLevel || "intermediate";

    // 1. Resolve topic from curriculum taxonomy
    let matched = req.topicId ? CurriculumTaxonomy.findTopic(req.topicId) : undefined;
    if (!matched && req.chapterId) {
      const subject = req.subjectId ? CurriculumTaxonomy.getSubject(req.subjectId) : undefined;
      const chapter = subject?.chapters.find(c => c.id === req.chapterId);
      if (chapter && chapter.topics.length > 0) {
        matched = { subject: subject!, chapter, topic: chapter.topics[0] };
      }
    }
    if (!matched && rawTopic) {
      matched = CurriculumTaxonomy.findTopic(rawTopic);
    }
    if (!matched && rawTopic) {
      const searchHits = CurriculumTaxonomy.search(rawTopic);
      if (searchHits.length > 0) {
        matched = searchHits[0];
      }
    }

    // 2. Extract or synthesize curriculum details
    const subjectName = matched?.subject.name || (req.subjectId ? req.subjectId.toUpperCase() : "General Science");
    const subjectId = matched?.subject.id || req.subjectId || "general";
    const chapterName = matched?.chapter.title || (req.chapterId ? req.chapterId.replace(/-/g, " ") : "Fundamentals");
    const chapterId = matched?.chapter.id || req.chapterId || "fundamentals";
    const topicTitle = matched?.topic.title || rawTopic || "Live Classroom Session";
    const topicId = matched?.topic.id || rawTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "custom-topic";
    const assetKey = matched?.topic.assetKey || (isDiagramKey(rawTopic) ? rawTopic : null);

    const learningObjectives = matched?.topic.learningObjectives || [
      `Understand foundational principles of ${topicTitle}.`,
      `Identify core components, structures, and their interactions.`,
      `Apply conceptual reasoning to solve real-world problems.`
    ];

    const mandatoryConcepts = matched?.topic.mandatoryConcepts || [
      topicTitle,
      "Core Mechanism",
      "Key Interactions"
    ];

    const keyLandmarks = matched?.topic.keyLandmarks || [];
    const formulas = matched?.topic.formulas || [];
    const misconceptions = matched?.topic.misconceptions || [];
    const suggestedPrompts = matched?.topic.suggestedPrompts || [
      "Explain the fundamental concept",
      "Show me a visual demonstration",
      "Quiz me on this topic"
    ];

    // 3. Resolve Asset and CIE Map
    let assetMap: AssetCanvasMap | undefined;
    if (assetKey) {
      assetMap = CanvasAssetRegistry.getAsset(assetKey);
    }

    // 4. Construct ClassroomContext
    const classroomContext: ClassroomContext = {
      subject: subjectName,
      subjectId,
      chapter: chapterName,
      chapterId,
      topic: topicTitle,
      topicId,
      studentLevel,
      learningObjectives,
      mandatoryConcepts,
      assetKey,
      assetTitle: assetMap?.title || topicTitle,
      keyLandmarks,
      formulas,
      misconceptions,
      suggestedPrompts,
      preparedAt: new Date().toISOString()
    };

    // 5. Pre-render initial whiteboard board page
    const initialPage = this.buildInitialBoardPage(classroomContext, assetMap);

    // 6. Build initial welcoming tutor turn
    const welcomeMessage: ChatMessage = {
      role: "assistant",
      content: this.generateTutorGreeting(classroomContext)
    };

    const sessionData: SessionData = {
      title: topicTitle,
      subject: subjectName,
      lessonKey: assetKey || topicId,
      pages: [initialPage],
      pageIndex: 0,
      messages: [welcomeMessage],
      suggestions: suggestedPrompts.slice(0, 3),
      saved: false,
      mode: assetKey ? "guided" : "llm",
      quiz: null,
      classroomContext
    };

    return { sessionData, classroomContext, assetMap };
  }

  private static buildInitialBoardPage(context: ClassroomContext, assetMap?: AssetCanvasMap): BoardPage {
    const marks: BoardMark[] = [];
    const regions: DiagramRegion[] = [];

    // Header: Subject & Chapter badge
    marks.push({
      type: "text",
      x: 53,
      y: 42,
      text: `${context.subject.toUpperCase()} · ${context.chapter}`,
      size: 15,
      color: green,
      weight: 650
    });

    // Lesson Title
    marks.push({
      type: "text",
      x: 53,
      y: 74,
      text: context.topic,
      size: 34,
      color: ink,
      weight: 700
    });

    // Underline
    marks.push({
      type: "path",
      d: "M55 86 Q250 83 450 85",
      color: "#84b998",
      strokeWidth: 3.2,
      fill: "none"
    });

    // Left Column: Learning Objectives
    marks.push({
      type: "text",
      x: 55,
      y: 118,
      text: "LEARNING OBJECTIVES:",
      size: 16,
      color: purple,
      weight: 650
    });

    context.learningObjectives.slice(0, 3).forEach((obj, idx) => {
      marks.push({
        type: "text",
        x: 68,
        y: 142 + idx * 26,
        text: `• ${obj.length > 48 ? obj.slice(0, 46) + "..." : obj}`,
        size: 16,
        color: ink,
        weight: 500
      });
    });

    // If formulas exist, display primary formula
    if (context.formulas.length > 0) {
      const topFormula = context.formulas[0];
      marks.push({
        type: "rect",
        x: 55,
        y: 228,
        w: 380,
        h: 46,
        fill: "#ebf4e8",
        color: "#85b69a",
        strokeWidth: 1.8
      });
      marks.push({
        type: "text",
        x: 70,
        y: 258,
        text: topFormula.length > 40 ? topFormula.slice(0, 38) + "..." : topFormula,
        size: 17,
        color: "#2d5940",
        weight: 600
      });
    } else {
      // Mandatory Concepts display
      marks.push({
        type: "text",
        x: 55,
        y: 232,
        text: "KEY CONCEPTS:",
        size: 15,
        color: blue,
        weight: 650
      });
      marks.push({
        type: "text",
        x: 55,
        y: 258,
        text: context.mandatoryConcepts.slice(0, 4).join("  •  "),
        size: 15,
        color: ink,
        weight: 500
      });
    }

    // Call to action note
    marks.push({
      type: "text",
      x: 55,
      y: 300,
      text: "🎙️ Tap the mic to ask anything, or click any prompt below.",
      size: 15,
      color: orange,
      weight: 500
    });

    // Right Side: Asset Placement & Landmarks
    if (context.assetKey && (assetMap || diagrams[context.assetKey])) {
      const imgX = 490;
      const imgY = 32;
      const imgW = 450;
      const imgH = 280;

      const src = assetMap ? assetMap.source : diagrams[context.assetKey]?.src || "/assets/heart.svg";
      const alt = assetMap ? assetMap.title : diagrams[context.assetKey]?.alt || "Lesson diagram";

      // Place asset mark on layer: "assets"
      marks.push({
        type: "image",
        x: imgX,
        y: imgY,
        w: imgW,
        h: imgH,
        src,
        alt,
        color: "#a8c2ae",
        strokeWidth: 1.2,
        layer: "assets"
      });

      // Extract and map regions
      if (assetMap && assetMap.elements.length > 0) {
        const scaleX = imgW / assetMap.naturalWidth;
        const scaleY = imgH / assetMap.naturalHeight;
        const displayAsset = {
          assetId: assetMap.assetId,
          source: assetMap.source,
          x: imgX,
          y: imgY,
          w: imgW,
          h: imgH,
          scaleX,
          scaleY
        };

        assetMap.elements.forEach(elem => {
          const transformed = transformGeometry(elem.geometry, displayAsset);
          const { x: rx, y: ry, w: rw, h: rh } = transformed.bounds;

          regions.push({
            id: elem.id,
            label: elem.name,
            x: Math.round(rx),
            y: Math.round(ry),
            w: Math.round(rw),
            h: Math.round(rh),
            aliases: elem.aliases,
            note: `${elem.name} (${elem.category})`
          });
        });
      } else if (diagrams[context.assetKey]) {
        const def = diagrams[context.assetKey];
        def.regions.forEach(r => {
          regions.push({
            ...r,
            x: r.x + imgX - def.image.x + (def.image.w - imgW) / 2,
            y: r.y + imgY - def.image.y + (def.image.h - imgH) / 2
          });
        });
      }
    }

    return {
      id: `page-${context.topicId}`,
      title: context.topic,
      marks,
      ink: [],
      cursor: { x: 890, y: 260 },
      regions
    };
  }

  private static generateTutorGreeting(context: ClassroomContext): string {
    const levelDescriptor = context.studentLevel === "beginner"
      ? "from fundamental first principles"
      : context.studentLevel === "advanced"
      ? "with deep structural and mathematical rigor"
      : "step by step";

    if (context.assetKey) {
      return `Welcome! Today we will explore **${context.topic}** ${levelDescriptor}.\n\nI have prepared the interactive diagram on the whiteboard. We'll examine each key structure, understand how it works, and see how everything connects. What part would you like to investigate first?`;
    }

    return `Welcome to your interactive session on **${context.topic}**!\n\nWe'll cover our key learning objectives ${levelDescriptor}. Feel free to ask questions or have me demonstrate any concept on the board. Where would you like to begin?`;
  }
}
