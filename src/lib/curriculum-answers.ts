import type { BoardMark, SupportedLanguage, TutorTurn } from "./types";

export interface DoubtContext {
  topic?: string;
  chapter?: number;
  chapterTitle?: string;
  caption?: string;
  timestamp?: number;
  sessionData?: any;
  currentMarks?: BoardMark[];
  currentRegions?: any[];
  allPages?: any[];
  lessonKey?: string;
}

export type RelevanceInput = string | DoubtContext;

/**
 * Validates whether the student's question relates to the current active lesson topic,
 * the current screen/whiteboard content (diagram, labels, text marks, numbers, colors),
 * or concepts taught/to be taught in the class.
 */
export function isQuestionRelevantToTopic(question: string, contextOrTopic?: RelevanceInput): boolean {
  if (!contextOrTopic) return true;
  const context: DoubtContext = typeof contextOrTopic === "string" ? { topic: contextOrTopic } : (contextOrTopic || {});
  const topic = context.topic || context.sessionData?.title || "";
  const t = topic.toLowerCase();
  const q = question.toLowerCase().trim();

  // 1. General classroom clarification, repetition, and interactive cues are always relevant
  if (
    /\b(repeat|again|what did you say|didn'?t understand|did not understand|explain this|can you explain|clarify|elaborate|help me|tell me more|doubt|question|sawaal|samjhao|samajh|dobara|wapas|shuru se|kya hai|matlab|point at|show me|circle|highlight|underline|box)\b/i.test(
      q
    )
  ) {
    return true;
  }

  // 2. Whiteboard, Screen, Diagram, Visual Marks & Spatial Queries
  // Anything referring to the screen, whiteboard, diagram, drawing, visual marks, shapes, colors, or spatial layout
  const isWhiteboardVisual =
    /\b(whiteboard|blackboard|board|screen|display|slide|current slide|this slide|next slide|previous slide|slide \d+|chapter \d+|page \d+)\b/i.test(q) ||
    /\b(diagram|drawing|picture|image|figure|illustration|sketch|visual|chart|graphic|flowchart|anatomy)\b/i.test(q) ||
    /\b(label|labels|marked|marking|marks|text|written|writing|bullet|bullet point|heading|title|number \d+|bullet \d+|item \d+)\b/i.test(q) ||
    /\b(box|circle|oval|ellipse|arrow|line|border|boundary|rim|dot|dots|color|colors|colour|colours|green|red|blue|purple|cyan|yellow|orange|lime|pink|pointer|cursor)\b/i.test(q) ||
    /\b(on the board|on the screen|on the diagram|in the diagram|in the picture|in this figure|left side|right side|top|bottom|center|middle|inside|outside|surrounding|pointing at|pointing to)\b/i.test(q) ||
    /\b(what is that|what does that mean|why is that drawn|what is written|what is showing|what are those|what is shown|what does this represent|explain this diagram|explain the diagram|explain this part|explain this label|look at the)\b/i.test(q);

  // 3. Concepts taught or to be taught in the class (agenda, flow, syllabus, recap)
  const isClassFlowQuery =
    /\b(next|previous|upcoming|taught|learnt|learned|learn next|teach next|covered|cover next|syllabus|curriculum|next part|earlier|before|agenda|topics? to be covered|what will we learn|what did we learn|summarize the class|class summary|recap)\b/i.test(
      q
    );

  if (isClassFlowQuery) {
    return true;
  }

  // 4. Dynamic extraction: Cross-reference query against all terms present on the whiteboard,
  // in the diagram regions, text marks, scene narrations, and all pages of this class session.
  const extractedTerms: string[] = [];

  // Extract from current page marks & all session pages
  const marksToScan: BoardMark[] = [
    ...(context.currentMarks || []),
    ...(context.sessionData?.pages?.[context.sessionData?.pageIndex || 0]?.marks || []),
  ];
  for (const mark of marksToScan) {
    if (mark.type === "text" && mark.text) {
      extractedTerms.push(mark.text.toLowerCase());
    }
    if (mark.type === "image" && mark.alt) {
      extractedTerms.push(mark.alt.toLowerCase());
    }
  }

  // Extract from regions (labels, aliases, notes, IDs)
  const regionsToScan: any[] = [
    ...(context.currentRegions || []),
    ...(context.sessionData?.pages?.[context.sessionData?.pageIndex || 0]?.regions || []),
  ];
  for (const r of regionsToScan) {
    if (r.id) extractedTerms.push(r.id.toLowerCase().replace(/[-_]/g, " "));
    if (r.label) extractedTerms.push(r.label.toLowerCase());
    if (r.note) extractedTerms.push(r.note.toLowerCase());
    if (Array.isArray(r.aliases)) {
      for (const alias of r.aliases) {
        if (typeof alias === "string") extractedTerms.push(alias.toLowerCase());
      }
    }
  }

  // Extract from all pages across the class session
  const allPagesToScan = context.allPages || context.sessionData?.pages || [];
  for (const p of allPagesToScan) {
    if (p.title) extractedTerms.push(p.title.toLowerCase());
    if (p.narration) extractedTerms.push(p.narration.toLowerCase());
  }

  if (context.chapterTitle) extractedTerms.push(context.chapterTitle.toLowerCase());
  if (context.caption) extractedTerms.push(context.caption.toLowerCase());

  // Check if any extracted multi-word phrase or significant term from the whiteboard/diagram appears in query
  for (const term of extractedTerms) {
    if (!term) continue;
    // Clean and split meaningful phrases and words
    const cleanTerm = term.replace(/[0-9.:()—\-&,]/g, " ").trim();
    const words = cleanTerm.split(/\s+/).filter((w: string) => w.length >= 3 && !/the|and|for|with|from|that|this|what|which|will|have|been|here|look|into|their|about/i.test(w));
    for (const word of words) {
      if (q.includes(word)) {
        return true;
      }
    }
  }

  // 5. Explicit Off-Topic Filter
  // Only trigger off-topic deferral if the query is strictly disconnected from the class
  const isStrictlyOffTopic =
    /\b(cricket|football|soccer|baseball|basketball|tennis|badminton|ipl|world cup|fifa|nba|tournament|match score|batting|bowling|wicket|virat kohli|rohit sharma|messi|ronaldo|movie|film|actor|actress|cinema|bollywood|hollywood|song|singer|music|album|concert|prime minister|president|election|politics|politician|government|parliament|bjp|congress|vote|pizza|burger|pasta|recipe|bake|cooking|chocolate cake|biryani|noodles|sandwich|weather|temperature|forecast|game|gaming|minecraft|fortnite|pubg|free fire|roblox|gta|playstation|xbox|joke|girlfriend|boyfriend|dating|crush|marry|stock|crypto|bitcoin|ethereum|trading)\b/i.test(
      q
    );

  if (isStrictlyOffTopic && !isWhiteboardVisual) {
    return false;
  }

  if (isWhiteboardVisual) {
    return true;
  }

  // 6. Comprehensive Domain Ontology Matrices

  // Domain A: Human Cell, Cellular Biology & Life Sciences
  if (t.includes("cell") || t.includes("bio") || t.includes("organelle") || t.includes("mitochondri")) {
    return /cell|membrane|plasma\s*membrane|lipid|bilayer|phospholipid|fluid\s*mosaic|permeab|nucleus|nuclei|nucleolus|nuclear|pore|envelope|chromatin|chromosome|dna|rna|mrna|trna|gene|genetic|mitochondri|atp|energy|powerhouse|respiration|cristae|matrix|ribosome|protein|amino\s*acid|peptide|endoplasmic|er\b|rough\s*er|smooth\s*er|golgi|dictyosome|vesicle|vacuole|lysosome|peroxisome|cytoplasm|cytosol|organelle|centrosome|centriole|cytoskeleton|microtubule|microfilament|cilia|flagell|chloroplast|plastid|thylakoid|stroma|cell\s*wall|plant\s*cell|animal\s*cell|eukaryot|prokaryot|bacteria|mitosis|meiosis|interphase|prophase|metaphase|anaphase|telophase|cell\s*division|cell\s*cycle|diffusion|osmosis|transport|endocytosis|exocytosis|phagocytosis|glycolysis|krebs|glucose|enzyme|biology|microscopic|कोशिका|केंद्रक|डीएनए|माइटोकॉन्ड्रिया|झिल्ली|साइटोप्लाज्म|राइबोसोम|प्रोटीन|अंगक|श्वसन|ऊर्जा|पादप\s*कोशिका|जंतु\s*कोशिका|गुणसूत्र/i.test(
      q
    );
  }

  // Domain B: Right Triangles, Geometry & Trigonometry
  if (t.includes("trigonometr") || t.includes("triangle") || t.includes("geometry") || t.includes("pythagor")) {
    return /triangl|hypotenuse|angle|degree|radian|right\s*angle|acute|obtuse|90\s*degree|theta|sine|sin\b|cos\b|cosine|tan\b|tangent|secant|sec\b|cosecant|cosec\b|csc\b|cotangent|cot\b|pythagor|perpendicular|base|adjacent|opposite|legs?|ratio|soh\s*cah\s*toa|formula|proof|area|perimeter|vertex|vertices|a\^2|b\^2|c\^2|a²|b²|c²|quadrant|unit\s*circle|geometry|math|त्रिभुज|कर्ण|लम्ब|आधार|समकोण|पाइथागोरस|त्रिकोणमिति|साइन|कोस|टेन|कोण/i.test(
      q
    );
  }

  // Domain C: Human Heart & Cardiovascular Circulation
  if (t.includes("heart") || t.includes("circulat") || t.includes("cardio") || t.includes("blood")) {
    return /heart|atrium|atria|ventricle|aorta|vena\s*cava|pulmonary|artery|vein|valve|tricuspid|bicuspid|mitral|semilunar|septum|blood|circulation|circulatory|cardiac|systol|diastol|oxygen|oxygenated|deoxygenated|hemoglobin|pulse|capillary|vessel|cardiovascular|हृदय|धमनी|शिरा|रक्त|आलिंद|निलय|कपाट/i.test(
      q
    );
  }

  // Domain D: Fractions & Rational Numbers
  if (t.includes("fraction") || t.includes("ratio")) {
    return /fraction|numerator|denominator|proper|improper|mixed|part|whole|divide|division|simplify|equivalent|ratio|proportion|decimal|half|quarter|अंश|हर|भिन्न/i.test(
      q
    );
  }

  // Domain E: Circuits, Electricity & Ohm's Law
  if (t.includes("circuit") || t.includes("ohm") || t.includes("electric") || t.includes("current")) {
    return /circuit|electric|current|voltage|volt|ampere|resistance|resistor|ohm|battery|wire|switch|load|power|charge|capacitor|series|parallel|v\s*=\s*i\s*r|विद्युत|परिपथ|प्रतिरोध|वोल्ट/i.test(
      q
    );
  }

  // Domain F: Water Cycle & Environmental Sciences
  if (t.includes("water") || t.includes("cycle") || t.includes("weather") || t.includes("climate")) {
    return /water|cycle|evaporation|condensation|precipitation|transpiration|cloud|rain|vapor|atmosphere|runoff|infiltration|groundwater|जल|चक्र|वाष्पीकरण|संघनन|वर्षा/i.test(
      q
    );
  }

  // Domain G: Gravity, Forces, Motion & Physics
  if (t.includes("gravity") || t.includes("friction") || t.includes("force") || t.includes("motion")) {
    return /gravity|friction|force|ramp|incline|normal\s*force|surface|slope|mass|weight|motion|acceleration|velocity|f\s*=\s*m\s*a|newton|push|pull|guru|गुरुत्वाकर्षण|घर्षण|बल/i.test(
      q
    );
  }

  // General fallback: check if any core keyword from topic is in question
  const topicWords = t.split(/\s+/).filter((w: string) => w.length > 3 && !/the|and|for|with|about/i.test(w));
  return topicWords.some((w: string) => q.includes(w));
}

/**
 * Generates pedagogical doubt resolutions for student interruptions.
 * Connects directly to the whiteboard diagram and visual markers.
 */
export function answerCurriculumDoubt(
  question: string,
  contextOrTopic?: RelevanceInput,
  language: SupportedLanguage = "en"
): TutorTurn {
  const q = question.toLowerCase().trim();
  const isHi = language === "hi" || /[\u0900-\u097F]/.test(question);
  const isHinglish = language === "hinglish";
  const context: DoubtContext = typeof contextOrTopic === "string" ? { topic: contextOrTopic } : (contextOrTopic || {});
  const topic = context.topic || context.sessionData?.title || "this topic";

  // Step 1: Verify question relevance to active class topic, whiteboard diagram & curriculum
  const isRelevant = isQuestionRelevantToTopic(q, context);

  // If question is irrelevant or out-of-scope for the active lecture:
  if (!isRelevant) {
    const answerEn = `That's an interesting question! However, right now we're focusing on our lesson on ${topic}. We can certainly discuss that query after our class! Let's resume and continue our lesson on the whiteboard.`;
    const answerHi = `यह एक बहुत ही दिलचस्प सवाल है! लेकिन अभी हम ${topic} के पाठ पर ध्यान केंद्रित कर रहे हैं। हम कक्षा समाप्त होने के बाद इस विषय पर ज़रूर चर्चा कर सकते हैं! चलिए अब व्हाइटबोर्ड पर अपने पाठ को आगे बढ़ाते हैं।`;
    const answerHinglish = `Yeh ek bahut interesting question hai! Lekin abhi hum ${topic} ke lesson par focus kar rahe hain. Is query par hum class khatam hone ke baad zaroor discuss kar sakte hain! Chaliye whiteboard par apne lecture ko continue karte hain.`;

    const finalExplanation = isHi ? answerHi : isHinglish ? answerHinglish : answerEn;
    return {
      title: `${topic} Off-Topic Query`,
      subject: "Academic Learning",
      explanation: finalExplanation,
      page: null,
      pages: undefined,
      suggestions: ["Resume lecture", `Ask about ${topic}`, "Continue class"],
      quiz: null,
      mode: "guided",
      doubtMarks: undefined,
      isIrrelevant: true,
    };
  }

  let answerEn = "";
  let answerHi = "";
  let answerHinglish = "";
  let suggestions = ["Continue lecture", "Ask another question", "Explain simply"];
  let doubtMarks: BoardMark[] | undefined;

  // 1. Diagram / Screen Visual Element Inquiries
  if (/green\s*border|outer\s*border|outer\s*boundary|boundary\s*line/.test(q)) {
    answerEn = "That green border you see marking the perimeter of the cell on our whiteboard is the cell membrane! It is a flexible, selective lipid bilayer that shields the cell and controls what enters and exits.";
    answerHi = "व्हाइटबोर्ड पर कोशिका की परिधि पर जो हरा बॉर्डर आप देख रहे हैं, वह कोशिका झिल्ली (Cell Membrane) है! यह एक लचीली लिपिड परत है जो कोशिका की सुरक्षा करती है।";
    answerHinglish = "Whiteboard par cell ke border par jo green outline dikh rahi hai, woh cell membrane hai! Yeh ek selective lipid bilayer hai jo cell ko protect karti hai.";
    suggestions = ["What does membrane do?", "Explain cytoplasm", "Continue lecture"];
    doubtMarks = [{ type: "ellipse", x: 726, y: 171, w: 96, h: 108, color: "#2ed573", fill: "none", strokeWidth: 3.2, annotation: true }];
  } else if (/protein\s*factory|bullet\s*4|number\s*4|item\s*4/.test(q)) {
    answerEn = "Notice item 4 on our whiteboard: 'Protein Factory'! This represents the cell's manufacturing pipeline where ribosomes assemble proteins on the rough endoplasmic reticulum, and the Golgi apparatus sorts and packages them for delivery.";
    answerHi = "व्हाइटबोर्ड पर बिंदु 4 देखिए: 'Protein Factory'! यह कोशिका की प्रोटीन निर्माण प्रणाली है जहाँ राइबोसोम प्रोटीन बनाते हैं और गॉल्जी उपकरण उन्हें पैक करके भेजता है।";
    answerHinglish = "Whiteboard par point 4 dekhiye: 'Protein Factory'! Yeh cell ka manufacturing pipeline hai jahan ribosomes rough ER par protein assemble karte hain aur Golgi apparatus unhe pack karta hai.";
    suggestions = ["What does Golgi do?", "Explain rough ER", "Continue lecture"];
    doubtMarks = [{ type: "ellipse", x: 677, y: 156, w: 45, h: 55, color: "#8a6a9e", fill: "none", strokeWidth: 3.0, annotation: true }];
  } else if (/diagram|drawing|screen|whiteboard|illustration|visual|overview/.test(q) && /show|explain|mean|represent|what is|kya hai/.test(q)) {
    answerEn = "Looking at our whiteboard diagram, you see a high-resolution microscopic view of the human cell! It highlights the protective cell membrane, the central genetic nucleus, energy-producing mitochondria, and the protein factory network. Ask me about any specific part!";
    answerHi = "व्हाइटबोर्ड पर इस आरेख को देखिए, यह मानव कोशिका का सूक्ष्म दृश्य है! इसमें बाहरी कोशिका झिल्ली, केंद्रक, माइटोकॉन्ड्रिया और प्रोटीन फैक्ट्रियां स्पष्ट रूप से दर्शाई गई हैं।";
    answerHinglish = "Whiteboard par yeh diagram dekhiye, yeh human cell ka clear microscopic view hai! Isme outer cell membrane, central nucleus, mitochondria aur protein factory show kiye gaye hain.";
    suggestions = ["Explain nucleus", "Explain mitochondria", "Continue lecture"];
  }

  // 2. Human Cell & Organelles
  else if (/golgi|vesicle|packaging|गॉल्जी|पैकिंग/.test(q)) {
    answerEn = "Great question! Look right here at the Golgi apparatus on the diagram—often called the cell's post office! It receives newly synthesized proteins from the ER, tags and refines them, and packages them into transport vesicles.";
    answerHi = "शानदार सवाल! आरेख में गॉल्जी उपकरण को देखिए—इसे कोशिका का पोस्ट ऑफिस कहा जाता है! यह एंडोप्लाज्मिक रेटिकुलम से प्रोटीन प्राप्त करता है, उन्हें संशोधित करता है और वेसिकल्स में पैक करता है।";
    answerHinglish = "Great question! Diagram me Golgi apparatus ko dekhiye—isko cell ka post office kehte hain! Yeh ER se protein receive karta hai, modify karta hai aur transport vesicles me pack karta hai.";
    suggestions = ["What are vesicles?", "Explain rough ER", "Continue lecture"];
    doubtMarks = [{ type: "ellipse", x: 745, y: 104, w: 35, h: 28, color: "#00d2d3", fill: "none", strokeWidth: 3.0, annotation: true }];
  } else if (/rough\s*er|smooth\s*er|endoplasmic|रेटिकुलम/.test(q)) {
    answerEn = "Look at the folded ribbon channels wrapping the nucleus—that is the endoplasmic reticulum! The 'rough' ER is studded with ribosomes that synthesize proteins, while the 'smooth' ER synthesizes lipids and detoxifies compounds.";
    answerHi = "केंद्रक के चारों ओर मुड़ी हुई झिल्लीदार नलिकाओं को देखिए—यह एंडोप्लाज्मिक रेटिकुलम है! खुरदरी (Rough) ER प्रोटीन बनाती है और चिकनी (Smooth) ER लिपिड का निर्माण करती है।";
    answerHinglish = "Nucleus ke paas folded channels ko dekhiye—yeh endoplasmic reticulum hai! Rough ER par ribosomes protein banate hain aur smooth ER lipids synthesize karti hai.";
    suggestions = ["What are ribosomes?", "Explain Golgi apparatus", "Continue lecture"];
    doubtMarks = [{ type: "ellipse", x: 677, y: 156, w: 30, h: 42, color: "#8a6a9e", fill: "none", strokeWidth: 3.0, annotation: true }];
  } else if (/cristae|matrix|inner\s*folds|folds\s*of\s*mitochondria/.test(q)) {
    answerEn = "Notice those wavy inner folds inside the mitochondria—those are the cristae! Folding the inner membrane dramatically expands the surface area, packing in thousands of ATP synthase machines to generate maximum energy.";
    answerHi = "माइटोकॉन्ड्रिया के भीतर की लहरदार तहों को देखिए—ये क्रिस्टी (Cristae) हैं! ये आंतरिक झिल्ली के सतही क्षेत्रफल को कई गुना बढ़ा देती हैं ताकि अधिकतम एटीपी ऊर्जा बन सके।";
    answerHinglish = "Mitochondria ke andar jo folds hain, unhe cristae kehte hain! Yeh inner membrane ke surface area ko badhate hain taaki maximum ATP energy produce ho sake.";
    suggestions = ["How is ATP made?", "Explain mitochondria", "Continue lecture"];
    doubtMarks = [{ type: "path", d: "M644 219 L708 219", color: "#2ed573", strokeWidth: 36, fill: "none", opacity: 0.36, annotation: true }];
  } else if (/plant\s*cell|cell\s*wall|chloroplast|पादप\s*कोशिका/.test(q)) {
    answerEn = "Great comparative biology question! Unlike human animal cells which have flexible membranes, plant cells also have a rigid outer cell wall made of cellulose and chloroplasts for photosynthesis. In our human cell lesson, we focus on animal cell organelles!";
    answerHi = "बहुत बढ़िया तुलनात्मक सवाल! पादप कोशिकाओं में सेल्यूलोज की कठोर कोशिका भित्ति (Cell Wall) और क्लोरोप्लास्ट होते हैं, जबकि मानव कोशिका में केवल लचीली कोशिका झिल्ली होती है।";
    answerHinglish = "Bahut accha question! Plant cells me rigid cell wall aur chloroplasts hote hain, jabki human animal cells me flexible cell membrane aur mitochondria hote hain.";
    suggestions = ["What about human cell?", "Explain cell membrane", "Continue lecture"];
  } else if (/nucleus|dna|genetic|blueprint|केंद्रक|डीएनए/.test(q)) {
    answerEn = "Great question! Look right here at the center of the cell on our whiteboard—that's the nucleus! It acts as the master control library, safely storing all your genetic DNA instructions inside the protective nuclear envelope.";
    answerHi = "बहुत बढ़िया सवाल! बोर्ड पर कोशिका के ठीक केंद्र में देखिए—यह केंद्रक (Nucleus) है! यह कोशिका का मुख्य नियंत्रण पुस्तकालय है जो दोहरी झिल्ली के भीतर आपके संपूर्ण डीएनए आनुवंशिक निर्देशों को सुरक्षित रखता है।";
    answerHinglish = "Great question! Whiteboard par cell ke center me dekhiye—yeh nucleus hai! Yeh cell ka master control library hai jisme aapke saare genetic DNA instructions nuclear envelope ke andar safely store rehte hain.";
    suggestions = ["What does DNA do?", "Explain mitochondria", "Continue lecture"];
    const isCh2 = context?.chapter === 2;
    doubtMarks = [
      {
        type: "ellipse",
        x: isCh2 ? 553 : 726,
        y: isCh2 ? 140 : 152,
        w: isCh2 ? 30 : 38,
        h: isCh2 ? 26 : 33,
        color: isCh2 ? "#e74c3c" : "#8a6a9e",
        fill: "none",
        strokeWidth: 3.0,
        annotation: true,
      },
    ];
  } else if (/mitochondri|powerhouse|atp|energy|माइटोकॉन्ड्रिया|ऊर्जा|पावरहाउस/.test(q)) {
    answerEn = "That's a wonderful question! Look at the oval mitochondria surrounding the nucleus on the board—they are the renowned powerhouses of the cell that generate life-giving ATP energy fuel through cellular respiration.";
    answerHi = "बहुत अच्छा प्रश्न! बोर्ड पर केंद्रक के चारों ओर अंडाकार माइटोकॉन्ड्रिया देखिए—ये कोशिका के प्रसिद्ध पावरहाउस हैं जो कोशिकीय श्वसन द्वारा ऊर्जा मुद्रा एटीपी (ATP) बनाते हैं।";
    answerHinglish = "Bahut accha question! Board par nucleus ke aas-paas oval mitochondria dekhiye—yeh cell ke powerhouses hain jo cellular respiration dwara life-giving ATP energy fuel banate hain.";
    suggestions = ["What are cristae?", "Explain ATP synthesis", "Continue lecture"];
    const isCh2 = context?.chapter === 2;
    doubtMarks = [
      isCh2
        ? {
            type: "path",
            d: "M740 130 L930 130",
            color: "#2ed573",
            strokeWidth: 36,
            fill: "none",
            opacity: 0.36,
            annotation: true,
          }
        : {
            type: "path",
            d: "M644 219 L708 219",
            color: "#2ed573",
            strokeWidth: 36,
            fill: "none",
            opacity: 0.36,
            annotation: true,
          },
    ];
  } else if (/membrane|lipid|bilayer|selective|झिल्ली|मेंब्रेन/.test(q)) {
    answerEn = "Notice the flexible outer boundary on our whiteboard—that's the cell membrane! It is a selective phospholipid bilayer that shields the cell and carefully regulates which vital nutrients enter and which waste products exit.";
    answerHi = "बोर्ड पर कोशिका की बाहरी सीमा देखिए—यह कोशिका झिल्ली (Cell Membrane) है! यह एक लचीली चयनात्मक परत है जो कोशिका की रक्षा करती है और नियंत्रित करती है कि कौन से पोषक तत्व अंदर आएंगे और अपशिष्ट बाहर जाएंगे।";
    answerHinglish = "Notice kijiye whiteboard par outer boundary—yeh cell membrane hai! Yeh ek selective phospholipid bilayer hai jo cell ko shield karti hai aur control karti hai ki kaun se nutrients andar aayenge aur waste bahar jayega.";
    suggestions = ["What is cytoplasm?", "How do nutrients enter?", "Continue lecture"];
    doubtMarks = [
      {
        type: "ellipse",
        x: 726,
        y: 171,
        w: 96,
        h: 108,
        color: "#2ed573",
        fill: "none",
        strokeWidth: 3.0,
        annotation: true,
      },
    ];
  } else if (/ribosome|protein|राइबोसोम|प्रोटीन/.test(q)) {
    answerEn = "Look at the small granular dots across the cell—those are ribosomes! They act as molecular protein builders, translating genetic RNA blueprints into essential functional proteins.";
    answerHi = "कोशिका में छोटे कणों को देखिए—ये राइबोसोम हैं! ये आरएनए ब्लूप्रिंट को पढ़कर जीवन के लिए आवश्यक प्रोटीन बनाते हैं।";
    answerHinglish = "Cell me jo granular dots hain, woh ribosomes hain! Yeh RNA blueprint ko translate karke functional proteins assemble karte hain.";
    suggestions = ["What is rough ER?", "Role of Golgi apparatus", "Continue lecture"];
    doubtMarks = [{ type: "ellipse", x: 677, y: 156, w: 30, h: 42, color: "#8a6a9e", fill: "none", strokeWidth: 3.0, annotation: true }];
  } else if (/cytoplasm|cytosol|साइटोप्लाज्म|द्रव्य/.test(q)) {
    answerEn = "Great observation! That nutrient-rich, jelly-like fluid you see throughout our board is the cytoplasm. It suspends and cushions every vital organelle, allowing cellular processes to run smoothly.";
    answerHi = "शानदार अवलोकन! बोर्ड पर कोशिका के भीतर जो पोषक तत्वों से भरा जेली जैसा तरल पदार्थ है, वह साइटोप्लाज्म है। यह सभी महत्वपूर्ण अंगकों को सहारा और सुरक्षा देता है।";
    answerHinglish = "Great observation! Board par jo jelly-like fluid cell ko fill karta hai, woh cytoplasm hai. Yeh sabhi organelles ko suspend aur cushion karke protect karta hai.";
    suggestions = ["What organelles are inside?", "Explain cell membrane", "Continue lecture"];
  }

  // 3. Class Flow & Progress Queries (Next, Previous, Recap)
  else if (/next|upcoming|learn\s*next|teach\s*next|agenda|what\s*will\s*we\s*learn/.test(q)) {
    answerEn = `In this visual lesson on ${topic}, we systematically walk through each core concept! We cover foundational boundaries, explore internal machinery and energy synthesis, dive into packaging pipelines, and conclude with an interactive whiteboard quiz.`;
    answerHi = `${topic} के इस पाठ में, हम चरण-दर-चरण सभी मुख्य विषयों को समझेंगे! हम आधारभूत संरचना, आंतरिक कार्यप्रणाली और समीक्षा को बोर्ड पर विस्तार से सीखेंगे।`;
    answerHinglish = `${topic} ke is lesson me hum step-by-step sabhi concepts cover karenge! Structural boundaries se lekar internal machinery aur practice review tak whiteboard par seekhenge.`;
    suggestions = ["Continue lecture", "Ask about current slide", "Show next part"];
  } else if (/previous|recap|what\s*did\s*we\s*learn|slide\s*1|earlier/.test(q)) {
    answerEn = `In the earlier part of our lesson, we established the foundational diagram on the whiteboard, identifying key structural boundaries and introducing the primary mechanisms of ${topic}.`;
    answerHi = `पाठ के पिछले भाग में हमने व्हाइटबोर्ड पर मुख्य आरेख और ${topic} की मूलभूत संरचना को समझा था।`;
    answerHinglish = `Lesson ke pehle part me humne whiteboard par main diagram aur ${topic} ke basic foundations ko explore kiya tha.`;
    suggestions = ["Continue lecture", "Explain current concept", "Ask another question"];
  }

  // 4. Geometry, Right Triangles & Pythagoras
  else if (/hypotenuse|कर्ण|longest side/.test(q)) {
    answerEn = "Great question! Look at our right triangle on the whiteboard—the hypotenuse is the side sitting directly opposite the 90-degree right angle, and it is always the longest side of the triangle.";
    answerHi = "बहुत बढ़िया सवाल! बोर्ड पर हमारे समकोण त्रिभुज को देखिए—90 डिग्री समकोण के ठीक सामने वाली भुजा कर्ण (Hypotenuse) है, और यह त्रिभुज की हमेशा सबसे लंबी भुजा होती है।";
    answerHinglish = "Great question! Whiteboard par right triangle dekhiye—90 degree ke theek samne wali side hypotenuse hoti hai, aur yeh hamesha triangle ki sabse lambi side hoti hai.";
    suggestions = ["What is Pythagoras theorem?", "How to calculate hypotenuse?", "Continue lecture"];
  } else if (/pythagor|a\^2\s*\+\s*b\^2|a²\s*\+\s*b²|पाइथागोरस/.test(q)) {
    answerEn = "Notice how the sides connect on our board! The Pythagorean theorem shows us that if we square both shorter legs and add them together, they equal the square of the hypotenuse: a² + b² = c².";
    answerHi = "बोर्ड पर त्रिभुज की भुजाओं को देखिए! पाइथागोरस प्रमेय सिखाता है कि दोनों छोटी भुजाओं के वर्गों का योग हमेशा कर्ण के वर्ग के बराबर होता है: a² + b² = c²।";
    answerHinglish = "Notice kijiye board par sides ka connection! Pythagoras theorem yeh batata hai ki dono shorter sides ke squares ka sum hypotenuse ke square ke equal hota hai: a² + b² = c².";
    suggestions = ["Give an example", "What is hypotenuse?", "Continue lecture"];
  } else if (/sin|cos|tan|trigonometr|त्रिकोणमिति|साइन|कोस|टेन/.test(q)) {
    answerEn = "Look at angle theta on our right triangle! In trigonometry: sine is opposite over hypotenuse (sin θ = opp/hyp), cosine is adjacent over hypotenuse (cos θ = adj/hyp), and tangent is opposite over adjacent (tan θ = opp/adj).";
    answerHi = "बोर्ड पर कोण थीटा को देखिए! त्रिकोणमिति में: साइन = लम्ब/कर्ण (sin θ = opp/hyp), कोसाइन = आधार/कर्ण (cos θ = adj/hyp), और टैन = लम्ब/आधार (tan θ = opp/adj) होता है।";
    answerHinglish = "Triangle par angle theta dekhiye! Trigonometry ratios: Sin θ = Opposite/Hypotenuse, Cos θ = Adjacent/Hypotenuse, aur Tan θ = Opposite/Adjacent hota hai.";
    suggestions = ["What is SOH-CAH-TOA?", "What is tan theta?", "Continue lecture"];
  }

  // 5. Fractions & Algebra
  else if (/fraction|numerator|denominator|भिन्न|अंश|हर/.test(q)) {
    answerEn = "Great question! A fraction represents equal parts of a whole: the top numerator tells how many parts you hold, and the bottom denominator reveals the total equal parts in the complete whole.";
    answerHi = "बहुत बढ़िया सवाल! भिन्न किसी संपूर्ण वस्तु के समान भागों को दर्शाती है: ऊपर का अंश बताता है कि कितने भाग लिए गए हैं, और नीचे का हर कुल समान भागों की संख्या बताता है।";
    answerHinglish = "Great question! Fraction ek whole ke equal parts represent karta hai: upar ka numerator batata hai kitne parts hain, aur neeche ka denominator total equal parts batata hai.";
    suggestions = ["How to add fractions?", "Explain 3/4", "Continue lecture"];
  } else if (/linear|equation|slope|intercept|समीकरण|रेखा/.test(q)) {
    answerEn = "Notice the line on our board! In linear equations (y = mx + b), m determines the steepness or slope of the line, while b marks the exact point where it crosses the vertical y-axis.";
    answerHi = "बोर्ड पर रेखा को ध्यान से देखिए! रूप y = mx + b में, m रेखा की ढलान (Slope) है और b वह बिंदु है जहाँ रेखा y-अक्ष को काटती है।";
    answerHinglish = "Notice kijiye board par straight line! y = mx + b me, m line ka slope batata hai aur b y-intercept hota hai jahan line y-axis ko cross karti hai.";
    suggestions = ["What is slope?", "How to solve for x?", "Continue lecture"];
  }

  // 6. Physics & Earth Sciences
  else if (/water.*cycle|evaporation|condensation|precipitation|जल.*चक्र|वाष्पीकरण|संघनन/.test(q)) {
    answerEn = "Look at the natural cycle on our board! Solar heat drives evaporation of liquid water, cooling in the upper atmosphere causes cloud condensation, and gravity returns moisture as precipitation.";
    answerHi = "बोर्ड पर इस प्राकृतिक चक्र को देखिए! सूर्य की ऊष्मा से वाष्पीकरण होता है, ऊपर ठंडी हवा में संघनन से बादल बनते हैं, और गुरुत्वाकर्षण वर्षा के रूप में जल वापस धरती पर लाता है।";
    answerHinglish = "Board par water cycle dekhiye! Sun ki heat se evaporation hota hai, upar clouds condense hote hain, aur gravity rain ke roop me water wapas lati hai.";
    suggestions = ["What is condensation?", "What is evaporation?", "Continue lecture"];
  } else if (/gravity|friction|ramp|inclined|normal force|गुरुत्वाकर्षण|घर्षण/.test(q)) {
    answerEn = "Look at the forces acting on our ramp! Gravity pulls straight down, creating a perpendicular normal force into the surface, while friction acts uphill to oppose sliding motion.";
    answerHi = "आनत तल पर बलों को देखिए! गुरुत्वाकर्षण सीधे नीचे खींचता है, जिससे सतह पर लंबवत अभिलंब बल बनता है, जबकि घर्षण बल फिसलने की दिशा के विपरीत काम करता है।";
    answerHinglish = "Ramp par forces dekhiye! Gravity seedhe neeche pull karti hai, normal force surface ke perpendicular hoti hai, aur friction sliding ke opposite resist karta hai.";
    suggestions = ["How to calculate friction?", "What is normal force?", "Continue lecture"];
  }

  // 7. Context-aware fallback using active lecture topic & chapter
  else {
    const chapterTitle = context?.chapterTitle ? ` in "${context.chapterTitle}"` : "";
    answerEn = `Great question! Looking closely at ${topic}${chapterTitle} on our whiteboard, the key insight is to see how each part works together as a unified system. When you're ready, we can continue our journey!`;
    answerHi = `बहुत बढ़िया सवाल! बोर्ड पर ${topic} के इस भाग को देखते हुए, सबसे महत्वपूर्ण बात यह समझना है कि सभी घटक कैसे आपस में मिलकर काम करते हैं। जब आप तैयार हों, हम आगे बढ़ सकते हैं!`;
    answerHinglish = `Great question! Board par ${topic} ke is concept ko dekhte hue, main point yeh hai ki sabhi parts kaise milkar work karte hain. Jab aap ready ho, hum continue kar sakte hain!`;
    suggestions = ["Continue lecture", "Show an example", "Explain it simply"];
  }

  const finalExplanation = isHi ? answerHi : isHinglish ? answerHinglish : answerEn;

  return {
    title: context?.topic ? `${context.topic} Doubt Resolution` : "Doubt Resolution",
    subject: "Academic Learning",
    explanation: finalExplanation,
    page: null,
    pages: undefined,
    suggestions,
    quiz: null,
    mode: "guided",
    doubtMarks,
    isIrrelevant: false,
  };
}
