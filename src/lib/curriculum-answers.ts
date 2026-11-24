import type { BoardMark, SupportedLanguage, TutorTurn } from "./types";

interface DoubtContext {
  topic?: string;
  chapter?: number;
  chapterTitle?: string;
  caption?: string;
  timestamp?: number;
}

export function answerCurriculumDoubt(
  question: string,
  context?: DoubtContext,
  language: SupportedLanguage = "en"
): TutorTurn {
  const q = question.toLowerCase().trim();
  const isHi = language === "hi" || /[\u0900-\u097F]/.test(question);
  const isHinglish = language === "hinglish";

  let answerEn = "";
  let answerHi = "";
  let answerHinglish = "";
  let suggestions = ["Continue lecture", "Ask another question", "Explain simply"];
  let doubtMarks: BoardMark[] | undefined;

  // 1. Human Cell & Organelles
  if (/nucleus|dna|genetic|blueprint|केंद्रक|डीएनए/.test(q)) {
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
  } else if (/ribosome|protein|endoplasmic|er\b|golgi|राइबोसोम|प्रोटीन|गॉल्जी/.test(q)) {
    answerEn = "Look at the folded ribbon channels wrapping the nucleus—those are the ribosomes and rough endoplasmic reticulum! They are the cell's microscopic protein factories, assembling amino acids and packaging essential proteins for the whole cell.";
    answerHi = "केंद्रक के चारों ओर मुड़ी हुई झिल्लीदार नलिकाओं को देखिए—ये राइबोसोम और खुरदरी एंडोप्लाज्मिक रेटिकुलम हैं! ये कोशिका की सूक्ष्म प्रोटीन फैक्ट्रियां हैं जो प्रोटीन का निर्माण और पैकिंग करती हैं।";
    answerHinglish = "Nucleus ke paas folded channels dekhiye—yeh ribosomes aur rough ER hain! Yeh cell ki microscopic protein factories hain jo amino acids se protein assemble aur package karti hain.";
    suggestions = ["What is rough ER?", "Role of Golgi apparatus", "Continue lecture"];
    doubtMarks = [
      {
        type: "ellipse",
        x: 677,
        y: 156,
        w: 30,
        h: 42,
        color: "#8a6a9e",
        fill: "none",
        strokeWidth: 3.0,
        annotation: true,
      },
    ];
  } else if (/cytoplasm|cytosol|साइटोप्लाज्म|द्रव्य/.test(q)) {
    answerEn = "Great observation! That nutrient-rich, jelly-like fluid you see throughout our board is the cytoplasm. It suspends and cushions every vital organelle, allowing cellular processes to run smoothly.";
    answerHi = "शानदार अवलोकन! बोर्ड पर कोशिका के भीतर जो पोषक तत्वों से भरा जेली जैसा तरल पदार्थ है, वह साइटोप्लाज्म है। यह सभी महत्वपूर्ण अंगकों को सहारा और सुरक्षा देता है।";
    answerHinglish = "Great observation! Board par jo jelly-like fluid cell ko fill karta hai, woh cytoplasm hai. Yeh sabhi organelles ko suspend aur cushion karke protect karta hai.";
    suggestions = ["What organelles are inside?", "Explain cell membrane", "Continue lecture"];
  }

  // 2. Geometry, Right Triangles & Pythagoras
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

  // 3. Fractions & Algebra
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

  // 4. Physics & Earth Sciences
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

  // 5. Context-aware fallback using active lecture topic & chapter
  else {
    const topic = context?.topic || "this topic";
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
  };
}
