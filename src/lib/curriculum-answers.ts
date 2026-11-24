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
    answerEn = "You asked about the nucleus. The nucleus is located in the central region of the cell, enclosed by the nuclear envelope. It acts as the master control center, safely storing your genetic DNA blueprints.";
    answerHi = "आपने केंद्रक (Nucleus) के बारे में पूछा। केंद्रक कोशिका के मध्य में स्थित होता है और दोहरी झिल्ली से सुरक्षित रहता है। यह कोशिका का मुख्य नियंत्रण कक्ष है जो संपूर्ण डीएनए (DNA) आनुवंशिक जानकारी सुरक्षित रखता है।";
    answerHinglish = "Aapne nucleus ke baare me poocha. Nucleus cell ke center me hota hai jo nuclear membrane se surrounded hai. Yeh cell ka control center hai jisme master DNA blueprints safely store hote hain.";
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
    answerEn = "You asked about mitochondria. Mitochondria are the oval-shaped powerhouses of the cell. They perform cellular respiration, breaking down glucose in the presence of oxygen to generate ATP energy fuel for cellular work.";
    answerHi = "आपने माइटोकॉन्ड्रिया के बारे में पूछा। माइटोकॉन्ड्रिया कोशिका के पावरहाउस कहलाते हैं। यह ग्लूकोज और ऑक्सीजन का उपयोग करके कोशिकीय श्वसन द्वारा एटीपी (ATP) ऊर्जा मुद्रा बनाते हैं, जिससे कोशिका के सभी कार्य चलते हैं।";
    answerHinglish = "Aapne mitochondria ke baare me poocha. Mitochondria cell ke powerhouses hote hain. Yeh glucose aur oxygen use karke cellular respiration dwara ATP energy currency banate hain jisse cell ke saare functions chalte hain.";
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
    answerEn = "You asked about the cell membrane. The cell membrane is a flexible, selective phospholipid bilayer enclosing the cell. It regulates precisely which nutrients enter and which waste products exit while shielding the interior.";
    answerHi = "आपने कोशिका झिल्ली (Cell Membrane) के बारे में पूछा। यह एक लचीली, चयनात्मक फॉस्फोलिपिड दोहरी परत है जो कोशिका को घेरे रखती है। यह नियंत्रित करती है कि कौन से पोषक तत्व अंदर आएंगे और कौन से अपशिष्ट बाहर जाएंगे।";
    answerHinglish = "Aapne cell membrane ke baare me poocha. Cell membrane ek flexible selective lipid bilayer hoti hai jo cell ko protect karti hai aur decide karti hai ki kaun se nutrients andar aayenge aur waste bahar jayega.";
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
    answerEn = "You asked about protein synthesis. Ribosomes are microscopic molecular machines that assemble amino acids into protein chains. Folded rough endoplasmic reticulum and the Golgi apparatus then inspect, fold, and package these proteins for transport.";
    answerHi = "आपने प्रोटीन निर्माण के बारे में पूछा। राइबोसोम सूक्ष्म आणविक मशीनें हैं जो अमीनो एसिड से प्रोटीन बनाती हैं। इसके बाद खुरदरी एंडोप्लाज्मिक रेटिकुलम और गॉल्जी उपकरण इन प्रोटीनों को मोड़कर और पैक करके गंतव्य तक पहुंचाते हैं।";
    answerHinglish = "Aapne protein synthesis ke baare me poocha. Ribosomes tiny machines hain jo proteins assemble karti hain. Rough ER aur Golgi apparatus in proteins ko fold aur package karke cell ke alag-alag parts me bhejte hain.";
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
    answerEn = "You asked about cytoplasm. Cytoplasm is the nutrient-rich, jelly-like fluid filling the space between the nucleus and the cell membrane, providing a protective medium that suspends all cellular organelles.";
    answerHi = "आपने साइटोप्लाज्म के बारे में पूछा। साइटोप्लाज्म एक पोषक तत्वों से भरपूर जेली जैसा तरल पदार्थ है जो केंद्रक और कोशिका झिल्ली के बीच रहता है और सभी अंगकों को सुरक्षित सहारा देता है।";
    answerHinglish = "Aapne cytoplasm ke baare me poocha. Cytoplasm nutrient-rich jelly-like fluid hota hai jo nucleus aur cell membrane ke beech rehta hai aur sabhi organelles ko suspend karke protect karta hai.";
    suggestions = ["What organelles are inside?", "Explain cell membrane", "Continue lecture"];
  }

  // 2. Geometry, Right Triangles & Pythagoras
  else if (/hypotenuse|कर्ण|longest side/.test(q)) {
    answerEn = "You asked about the hypotenuse. In a right-angled triangle, the hypotenuse is the side opposite the 90-degree right angle, and it is always the longest side of the triangle.";
    answerHi = "आपने कर्ण (Hypotenuse) के बारे में पूछा। समकोण त्रिभुज में 90 डिग्री समकोण के ठीक सामने वाली भुजा कर्ण कहलाती है, और यह त्रिभुज की हमेशा सबसे लंबी भुजा होती है।";
    answerHinglish = "Aapne hypotenuse ke baare me poocha. Right-angled triangle me 90 degree ke samne wali side hypotenuse kehlati hai, aur yeh hamesha triangle ki sabse lambi side hoti hai.";
    suggestions = ["What is Pythagoras theorem?", "How to calculate hypotenuse?", "Continue lecture"];
  } else if (/pythagor|a\^2\s*\+\s*b\^2|a²\s*\+\s*b²|पाइथागोरस/.test(q)) {
    answerEn = "You asked about the Pythagorean theorem. It states that in any right triangle, the sum of the squares of the two shorter legs equals the square of the hypotenuse: a² + b² = c².";
    answerHi = "आपने पाइथागोरस प्रमेय के बारे में पूछा। यह प्रमेय बताता है कि किसी समकोण त्रिभुज में दो छोटी भुजाओं के वर्गों का योग कर्ण के वर्ग के बराबर होता है: a² + b² = c²।";
    answerHinglish = "Aapne Pythagoras theorem ke baare me poocha. Yeh batata hai ki kisi bhi right triangle me dono choti sides ke squares ka sum hypotenuse ke square ke barabar hota hai: a² + b² = c².";
    suggestions = ["Give an example", "What is hypotenuse?", "Continue lecture"];
  } else if (/sin|cos|tan|trigonometr|त्रिकोणमिति|साइन|कोस|टेन/.test(q)) {
    answerEn = "You asked about trigonometric ratios. For an angle θ in a right triangle: sine is opposite over hypotenuse (sin θ = opp/hyp), cosine is adjacent over hypotenuse (cos θ = adj/hyp), and tangent is opposite over adjacent (tan θ = opp/adj).";
    answerHi = "आपने त्रिकोणमितीय अनुपातों के बारे में पूछा। समकोण त्रिभुज में: साइन = लम्ब/कर्ण (sin θ = opp/hyp), कोसाइन = आधार/कर्ण (cos θ = adj/hyp), और टैन = लम्ब/आधार (tan θ = opp/adj) होता है।";
    answerHinglish = "Aapne trigonometry ratios ke baare me poocha. Right triangle me: Sin θ = Opposite/Hypotenuse, Cos θ = Adjacent/Hypotenuse, aur Tan θ = Opposite/Adjacent hota hai (SOH-CAH-TOA rule).";
    suggestions = ["What is SOH-CAH-TOA?", "What is tan theta?", "Continue lecture"];
  }

  // 3. Fractions & Algebra
  else if (/fraction|numerator|denominator|भिन्न|अंश|हर/.test(q)) {
    answerEn = "You asked about fractions. A fraction represents equal parts of a whole: the top number (numerator) counts how many parts you have, and the bottom number (denominator) tells the total number of equal parts in the whole.";
    answerHi = "आपने भिन्न (Fractions) के बारे में पूछा। भिन्न किसी पूरी वस्तु के समान भागों को दर्शाती है: ऊपर की संख्या (अंश/Numerator) बताती है कि कितने भाग लिए गए हैं, और नीचे की संख्या (हर/Denominator) कुल समान भागों की संख्या बताती है।";
    answerHinglish = "Aapne fractions ke baare me poocha. Fraction batata hai ki pure part me se kitne hisse liye gaye. Upar ka number (numerator) selected parts batata hai aur neeche ka number (denominator) total equal parts batata hai.";
    suggestions = ["How to add fractions?", "Explain 3/4", "Continue lecture"];
  } else if (/linear|equation|slope|intercept|समीकरण|रेखा/.test(q)) {
    answerEn = "You asked about linear equations. A linear equation describes a straight line with constant rate of change. In slope-intercept form (y = mx + b), m is the steepness or slope, and b is where the line crosses the y-axis.";
    answerHi = "आपने रैखिक समीकरण (Linear Equation) के बारे में पूछा। यह एक सीधी रेखा को दर्शाता है जिसका ढलान स्थिर रहता है। रूप y = mx + b में, m रेखा का ढलान (Slope) है और b वह बिंदु है जहाँ रेखा y-अक्ष को काटती है।";
    answerHinglish = "Aapne linear equation ke baare me poocha. Yeh ek straight line represent karta hai. y = mx + b form me, m slope ya steepness batata hai aur b y-intercept hota hai jahan line y-axis ko cross karti hai.";
    suggestions = ["What is slope?", "How to solve for x?", "Continue lecture"];
  }

  // 4. Physics & Earth Sciences
  else if (/water.*cycle|evaporation|condensation|precipitation|जल.*चक्र|वाष्पीकरण|संघनन/.test(q)) {
    answerEn = "You asked about the water cycle. Solar energy heats water causing evaporation into vapor, cooling air causes condensation into clouds, and gravity brings water back as precipitation like rain or snow.";
    answerHi = "आपने जल चक्र के बारे में पूछा। सूर्य की गर्मी से पानी भाप बनकर उड़ता है (वाष्पीकरण), ऊपर ठंडी हवा में संघनित होकर बादल बनते हैं (संघनन), और गुरुत्वाकर्षण के कारण वर्षा के रूप में वापस धरती पर गिरता है (वर्षण)।";
    answerHinglish = "Aapne water cycle ke baare me poocha. Sun ki heat se water evaporate hota hai, upar thandi air me condense hokar clouds bante hain, aur gravity ki wajah se barish (precipitation) ke roop me wapas zameen par aata hai.";
    suggestions = ["What is condensation?", "What is evaporation?", "Continue lecture"];
  } else if (/gravity|friction|ramp|inclined|normal force|गुरुत्वाकर्षण|घर्षण/.test(q)) {
    answerEn = "You asked about mechanics and forces. On an inclined ramp, gravity pulls straight downward, decomposing into a normal force perpendicular to the surface and a downhill force countered by frictional resistance opposing slide.";
    answerHi = "आपने बलों और घर्षण के बारे में पूछा। आनत तल (Ramp) पर गुरुत्वाकर्षण सीधे नीचे खींचता है, जो दो घटकों में बंटता है: सतह के लंबवत अभिलंब बल और नीचे फिसलने वाला बल जिसका विरोध घर्षण बल करता है।";
    answerHinglish = "Aapne forces aur friction ke baare me poocha. Ramp par gravity seedhe neeche act karti hai, jisme normal force surface ke perpendicular hoti hai aur friction sliding motion ko oppose karti hai.";
    suggestions = ["How to calculate friction?", "What is normal force?", "Continue lecture"];
  }

  // 5. Context-aware fallback using active lecture topic & chapter
  else {
    const topic = context?.topic || "this topic";
    const chapterTitle = context?.chapterTitle ? ` in "${context.chapterTitle}"` : "";
    answerEn = `You asked: "${question.trim()}". During our study of ${topic}${chapterTitle}, the key takeaway is to connect the definition to how its parts collaborate. Each concept builds directly on the previous step so you can apply it with confidence.`;
    answerHi = `आपने पूछा: "${question.trim()}"। ${topic} के इस भाग में सबसे महत्वपूर्ण बात यह समझना है कि सभी घटक कैसे आपस में मिलकर काम करते हैं। जब आप तैयार हों, हम व्याख्यान जारी रख सकते हैं।`;
    answerHinglish = `Aapne poocha: "${question.trim()}". ${topic} ke is chapter me sabse main point yeh hai ki iske saare components kaise coordinate karte hain. Jab aap ready ho, lecture resume kar sakte hain.`;
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
