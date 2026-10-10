import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, type ChatMessage, type Session, type StudyTask } from "./api";
import {
  Bell,
  BookOpen,
  BookText,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  CircleCheckBig,
  Crown,
  Dumbbell,
  FolderKanban,
  LayoutGrid,
  MessageSquareText,
  PanelLeft,
  PiggyBank,
  BriefcaseBusiness,
  Search,
  Settings,
  Sparkles,
  Trophy,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

const sidebarItems = [
  { label: "Overview", active: true, icon: LayoutGrid },
  { label: "My Learning", icon: BookOpen },
  { label: "Schedule", icon: CalendarDays },
  { label: "Courses", icon: BookText },
  { label: "Assignments", icon: FolderKanban },
  { label: "Daily Life Planner", icon: CalendarDays },
  { label: "Money Manager", icon: PiggyBank },
  { label: "Career & Job Guide", icon: BriefcaseBusiness },
  { label: "Messages", icon: MessageSquareText, badge: 4 },
  { label: "Achievements", icon: Trophy },
  { label: "Community", icon: UserRound },
  { label: "Settings", icon: Settings },
];

const weekBars = [7, 4, 6, 8, 10, 5, 7];
const subjectOptionsFor = (standard: string) => {
  const grade = Number(standard.match(/^Grade (\d+)$/)?.[1]);
  if (grade && grade <= 5) return ["English", "Mathematics", "Science", "Social Studies", "Art & Creativity"];
  if (grade && grade <= 8) return ["English", "Mathematics", "Science", "History & Geography", "Computer Basics", "Art & Creativity"];
  if (grade && grade <= 10) return ["English", "Mathematics", "Physics", "Chemistry", "Biology", "History & Geography", "Computer Applications"];
  if (standard === "Undergraduate" || standard === "Postgraduate") {
    return ["Computer Science", "Mathematics", "Physics", "Business", "Design", "Languages"];
  }
  if (standard === "Other") return ["English", "Mathematics", "Science", "Computer Basics", "Other"];
  return ["English", "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Economics", "Business Studies"];
};

const courseTitleFor = (subject: string, standard: string) => {
  const grade = Number(standard.match(/^Grade (\d+)$/)?.[1]);
  const primary = grade > 0 && grade <= 5;
  const middle = grade >= 6 && grade <= 8;
  const secondary = grade >= 9 && grade <= 10;
  const titles: Record<string, string> = {
    English: primary ? "Reading & Writing" : "English Language & Literature",
    Mathematics: primary ? "Number Skills" : middle ? "Mathematics Foundations" : secondary ? "Algebra & Geometry" : "Advanced Mathematics",
    Science: primary ? "Exploring the Natural World" : "General Science",
    "Social Studies": "People, Places & Communities",
    "History & Geography": "History & Geography",
    "Computer Basics": "Digital Skills & Computer Basics",
    "Computer Applications": "Computer Applications",
    Physics: "Physics",
    Chemistry: "Chemistry",
    Biology: "Biology",
    "Computer Science": "Computer Science",
    Economics: "Economics",
    "Business Studies": "Business Studies",
    Business: "Business",
    Design: "Design Fundamentals",
    Languages: "Language Learning",
    "Art & Creativity": "Art & Creativity",
    Other: "Personalized Study",
  };
  return titles[subject] || subject;
};

const courseStyles = [
  { color: "bg-[#eae7ff]", accent: "bg-[#b8a5ff]" },
  { color: "bg-[#dff4ea]", accent: "bg-[#8cd8b1]" },
  { color: "bg-[#fff0df]", accent: "bg-[#f0bf73]" },
];
const courseProgress = [75, 40, 60];
const courseTeachers = ["James Smith", "Olivia Brown", "Michael Lee"];
const studyIntervalSeconds = 60 * 60;
const breakDurationSeconds = 5 * 60;
const physicalBreakSuggestions = [
  "Stand up and gently stretch your arms and shoulders.",
  "Walk around safely for a few minutes and look away from your screen.",
  "Refill your water and take a few slow, comfortable breaths.",
  "Try a gentle neck and wrist stretch; stop if anything feels uncomfortable.",
];
const translations: Record<string, string> = {
  "Overview": "अवलोकन",
  "My Learning": "मेरी पढ़ाई",
  "Schedule": "समय-सारणी",
  "Courses": "पाठ्यक्रम",
  "Assignments": "असाइनमेंट",
  "Messages": "संदेश",
  "Achievements": "उपलब्धियाँ",
  "Community": "समुदाय",
  "Settings": "सेटिंग्स",
  "Ask AI Tutor": "AI ट्यूटर से पूछें",
  "Your Learning Activity": "आपकी पढ़ाई की गतिविधि",
  "Continue Learning": "पढ़ाई जारी रखें",
  "View All": "सभी देखें",
  "All": "सभी",
  "In Progress": "जारी",
  "Completed": "पूरा हुआ",
  "Quick Stats": "त्वरित जानकारी",
  "Today's Plan": "आज की योजना",
  "View Full Schedule": "पूरी समय-सारणी देखें",
  "Learning Progress": "पढ़ाई की प्रगति",
  "Your Study Planner": "आपकी पढ़ाई की योजना",
  "Tasks sync to your account": "काम आपके खाते में सेव होते हैं",
  "Add a study task...": "पढ़ाई का काम जोड़ें...",
  "Add task": "काम जोड़ें",
  "Save settings": "सेटिंग्स सेव करें",
  "Sign out": "साइन आउट",
  "Profile & study settings": "प्रोफ़ाइल और पढ़ाई की सेटिंग्स",
  "Your profile is saved to your account.": "आपकी प्रोफ़ाइल खाते में सेव है।",
  "Class / standard": "कक्षा",
  "Daily study goal": "रोज़ का पढ़ाई लक्ष्य",
  "Study subjects for": "के विषय",
  "Study & Life Tools": "पढ़ाई और जीवन के सहायक टूल",
  "Daily Life Planner": "रोज़मर्रा की योजना",
  "Money Manager": "पैसों का हिसाब",
  "Career & Job Guide": "करियर और नौकरी मार्गदर्शन",
  "Create a balanced routine for school, homework, rest, and your priorities.": "स्कूल, होमवर्क, आराम और प्राथमिकताओं के लिए संतुलित दिनचर्या बनाएँ।",
  "Track allowance, spending, and savings privately on this device.": "जेब खर्च, खर्च और बचत का हिसाब इस डिवाइस पर रखें।",
  "Explore age-appropriate career paths related to your interests and subjects.": "रुचियों और विषयों से जुड़े, कक्षा के अनुसार करियर विकल्प जानें।",
  "Build my daily plan": "मेरी दिनचर्या बनाएँ",
  "Review money basics": "पैसों की बुनियादी बातें",
  "Explore career paths": "करियर विकल्प देखें",
  "Break time": "आराम का समय",
  "You’ve studied for an hour. Take a five-minute break.": "आपने एक घंटा पढ़ाई की है। पाँच मिनट का आराम करें।",
  "Time until your next break": "अगले आराम तक का समय",
  "Focused study this hour": "इस घंटे की पढ़ाई",
  "Your study screen is paused": "पढ़ाई की स्क्रीन थोड़ी देर रुकी है",
  "A five-minute reset helps you return refreshed.": "पाँच मिनट का आराम लेकर ताज़गी से लौटें।",
  "Move gently, only in a way that feels comfortable.": "हल्की गतिविधि करें, केवल उतनी जितनी आरामदायक लगे।",
  "Break ends in": "आराम समाप्त होगा",
  "Stand up and gently stretch your arms and shoulders.": "खड़े होकर हाथों और कंधों को धीरे से स्ट्रेच करें।",
  "Walk around safely for a few minutes and look away from your screen.": "कुछ मिनट सुरक्षित रूप से टहलें और स्क्रीन से नज़र हटाएँ।",
  "Refill your water and take a few slow, comfortable breaths.": "पानी भरें और आराम से कुछ धीमी साँसें लें।",
  "Try a gentle neck and wrist stretch; stop if anything feels uncomfortable.": "गर्दन और कलाई को धीरे से स्ट्रेच करें; असहज लगे तो रुक जाएँ।",
  "Good morning": "सुप्रभात",
  "Language": "भाषा",
  "Next screen break in": "अगला स्क्रीन ब्रेक",
  "English": "अंग्रेज़ी",
  "Hindi": "हिन्दी",
  "Allowance / pocket money": "जेब खर्च / मिलने वाले पैसे",
  "Spent": "खर्च",
  "Saved": "बचत",
  "Left to plan": "बाकी राशि",
  "Amount": "राशि",
  "Reset amounts": "राशि मिटाएँ",
  "Amounts stay on this device and are not sent to the tutor.": "राशियाँ इसी डिवाइस पर रहती हैं, ट्यूटर को नहीं भेजी जातीं।",
  "You’re all caught up. Nice work!": "सब काम पूरे हैं। बहुत बढ़िया!",
  "Create my account": "मेरा खाता बनाएँ",
  "Welcome back": "वापसी पर स्वागत है",
  "Sign in": "साइन इन",
  "Full name": "पूरा नाम",
  "Email address": "ईमेल पता",
  "Password": "पासवर्ड",
  "Let’s set up your learning space.": "आइए आपकी पढ़ाई की जगह तैयार करें।",
  "AI Study Tutor": "AI पढ़ाई सहायक",
  "Gemini connection needs setup": "Gemini कनेक्शन सेट करें",
  "Study community": "पढ़ाई समुदाय",
  "Sample learner profiles from the community.": "समुदाय के विद्यार्थियों के उदाहरण प्रोफ़ाइल।",
  "Your name": "आपका नाम",
  "What are you studying?": "आप कौन से विषय पढ़ते हैं?",
  "Plan a focused study block": "ध्यान से पढ़ाई का समय तय करें",
  "Hours spent": "पढ़ाई के घंटे",
  "12% more than last week": "पिछले सप्ताह से 12% अधिक",
  "This Week": "इस सप्ताह",
  "Courses Enrolled": "चुने हुए विषय",
  "Tasks Completed": "पूरे किए काम",
  "Upcoming Tasks": "आने वाले काम",
  "My Class": "मेरी कक्षा",
  "My Subjects": "मेरे विषय",
  "Reading & Writing": "पढ़ना और लिखना",
  "English Language & Literature": "अंग्रेज़ी भाषा और साहित्य",
  "Number Skills": "संख्या ज्ञान",
  "Mathematics Foundations": "गणित की बुनियाद",
  "Algebra & Geometry": "बीजगणित और ज्यामिति",
  "Advanced Mathematics": "उन्नत गणित",
  "Exploring the Natural World": "प्रकृति की खोज",
  "General Science": "सामान्य विज्ञान",
  "People, Places & Communities": "लोग, स्थान और समुदाय",
  "History & Geography": "इतिहास और भूगोल",
  "Digital Skills & Computer Basics": "डिजिटल कौशल और कंप्यूटर की बुनियाद",
  "Computer Applications": "कंप्यूटर अनुप्रयोग",
  "Physics": "भौतिक विज्ञान",
  "Chemistry": "रसायन विज्ञान",
  "Biology": "जीव विज्ञान",
  "Computer Science": "कंप्यूटर विज्ञान",
  "Economics": "अर्थशास्त्र",
  "Business Studies": "व्यवसाय अध्ययन",
  "Business": "व्यवसाय",
  "Design Fundamentals": "डिज़ाइन की बुनियाद",
  "Language Learning": "भाषा सीखना",
  "Art & Creativity": "कला और रचनात्मकता",
  "Science": "विज्ञान",
  "Computer Basics": "कंप्यूटर की बुनियाद",
  "Computer Applications": "कंप्यूटर अनुप्रयोग",
  "Languages": "भाषाएँ",
  "Design": "डिज़ाइन",
  "Other": "अन्य",
  "Your Class": "आपकी कक्षा",
  "Tasks sync to your account": "काम आपके खाते में सेव होते हैं",
  "Today’s Plan": "आज की योजना",
  "Top 10% Learner": "शीर्ष 10% विद्यार्थी",
  "Keep up the great work!": "बहुत अच्छा कर रहे हैं!",
  "Gemini is thinking…": "Gemini जवाब तैयार कर रहा है…",
  "Ask your study question...": "अपना पढ़ाई का सवाल पूछें...",
  "Send": "भेजें",
  "No tasks yet. Add a study task below.": "अभी कोई काम नहीं है। नीचे पढ़ाई का काम जोड़ें।",
  "Open planner page": "योजना पृष्ठ खोलें",
  "Open money page": "पैसों का पृष्ठ खोलें",
  "Open career page": "करियर पृष्ठ खोलें",
  "Plan school, study, rest, and personal time in one place.": "स्कूल, पढ़ाई, आराम और अपने समय की योजना एक जगह बनाएँ।",
  "Ask ThriveMate AI to create a routine for your school day.": "स्कूल के दिन की दिनचर्या बनाने के लिए ThriveMate AI से पूछें।",
  "No tasks yet. Add one to build your routine.": "अभी कोई काम नहीं है। दिनचर्या बनाने के लिए काम जोड़ें।",
  "Your money stays private on this device.": "आपके पैसों का हिसाब इसी डिवाइस पर निजी रहता है।",
  "Money skills for everyday life": "रोज़मर्रा के जीवन के लिए पैसों का ज्ञान",
  "Track money coming in, spending, and savings. The remaining amount is calculated here; nothing is sent to the AI tutor.": "मिलने वाले पैसे, खर्च और बचत का हिसाब रखें। बाकी राशि यहीं जोड़ी जाती है; AI ट्यूटर को कुछ नहीं भेजा जाता।",
  "Get age-appropriate tips for needs, wants, and saving goals.": "ज़रूरतों, इच्छाओं और बचत लक्ष्यों पर अपनी उम्र के अनुसार सुझाव पाएँ।",
  "Explore careers connected to your subjects": "अपने विषयों से जुड़े करियर जानें",
  "Explore realistic paths, skills to try, and small next steps. Your class and subjects help tailor suggestions.": "व्यावहारिक करियर, आज़माने योग्य कौशल और अगले छोटे कदम जानें। आपकी कक्षा और विषय सुझावों को आपके अनुसार बनाते हैं।",
  "Get career ideas": "करियर सुझाव पाएँ",
  "Study planner": "पढ़ाई की योजना",
  "Money management": "पैसों का प्रबंधन",
  "Career guide": "करियर मार्गदर्शिका",
  "Add a study task": "पढ़ाई का काम जोड़ें",
  "Today's Plan": "आज की योजना",
  "Everyday money basics": "पैसों की रोज़मर्रा की बुनियादी बातें",
  "Career suggestions are for exploration and learning; they cannot guarantee a job, salary, or outcome.": "करियर सुझाव केवल जानकारी और खोज के लिए हैं; नौकरी, वेतन या परिणाम की गारंटी नहीं देते।",
};
const translate = (text: string, language: string) => language === "Hindi" ? translations[text] || text : text;

function loadBreakState(email: string) {
  try {
    const stored = localStorage.getItem(`lumilearn:break:${email}`);
    if (!stored) return { studiedSeconds: 0, breakUntil: 0 };
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null || !("studiedSeconds" in parsed) || !("breakUntil" in parsed)) {
      throw new Error("Saved break timer data is invalid.");
    }
    const studiedSeconds = Number(parsed.studiedSeconds);
    const breakUntil = Number(parsed.breakUntil);
    if (!Number.isFinite(studiedSeconds) || studiedSeconds < 0 || !Number.isFinite(breakUntil) || breakUntil < 0) {
      throw new Error("Saved break timer data is invalid.");
    }
    return { studiedSeconds, breakUntil };
  } catch (error) {
    console.error("Could not load break timer:", error);
    return { studiedSeconds: 0, breakUntil: 0 };
  }
}

const toDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const todayDateKey = () => toDateKey(new Date());

export default function App() {
  const [screen, setScreen] = useState<"loading" | "landing" | "signin" | "onboarding" | "dashboard">("loading");
  const [activeSection, setActiveSection] = useState("Overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [studentName, setStudentName] = useState("Archie");
  const [studentStandard, setStudentStandard] = useState("Grade 12");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["Computer Science", "Mathematics"]);
  const [studyGoal, setStudyGoal] = useState("1 hour a day");
  const [language, setLanguage] = useState<"English" | "Hindi">(() => {
    const saved = localStorage.getItem("lumilearn:language");
    return saved === "Hindi" ? "Hindi" : "English";
  });
  const [studiedSeconds, setStudiedSeconds] = useState(0);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(0);
  const [moneyAmounts, setMoneyAmounts] = useState({ allowance: "", spent: "", saved: "" });
  const [moneyLoadedFor, setMoneyLoadedFor] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [apiError, setApiError] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiConfigured, setAiConfigured] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [taskDraft, setTaskDraft] = useState("");
  const [dueDateDraft, setDueDateDraft] = useState(todayDateKey);
  const [reasonDraft, setReasonDraft] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayDateKey);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [taskBusy, setTaskBusy] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState("");
  const [failedQuestion, setFailedQuestion] = useState("");
  const [chatCooldownUntil, setChatCooldownUntil] = useState(0);
  const [chatCooldownSeconds, setChatCooldownSeconds] = useState(0);
  const [healthChecked, setHealthChecked] = useState(false);
  const isLifeToolsPage = ["Daily Life Planner", "Money Manager", "Career & Job Guide"].includes(activeSection);
  useEffect(() => {
    localStorage.setItem("lumilearn:language", language);
  }, [language]);
  useEffect(() => {
    if (!chatCooldownUntil) {
      setChatCooldownSeconds(0);
      return;
    }
    const updateCooldown = () => {
      const remaining = Math.max(0, Math.ceil((chatCooldownUntil - Date.now()) / 1000));
      setChatCooldownSeconds(remaining);
      if (remaining === 0) setChatCooldownUntil(0);
    };
    updateCooldown();
    const interval = window.setInterval(updateCooldown, 1000);
    return () => window.clearInterval(interval);
  }, [chatCooldownUntil]);
  useEffect(() => {
    if (screen !== "dashboard" || !studentEmail) return;
    const timerState = loadBreakState(studentEmail);
    let elapsed = timerState.studiedSeconds;
    let breakUntil = timerState.breakUntil;
    let lastTick = Date.now();
    let wasVisible = document.visibilityState === "visible";
    const updateTimer = () => {
      const now = Date.now();
      if (breakUntil > Date.now()) {
        const remaining = Math.ceil((breakUntil - now) / 1000);
        setBreakSecondsLeft(remaining);
        setStudiedSeconds(0);
        if (remaining > 0) {
          localStorage.setItem(`lumilearn:break:${studentEmail}`, JSON.stringify({ studiedSeconds: 0, breakUntil }));
          lastTick = now;
          wasVisible = document.visibilityState === "visible";
          return;
        }
        breakUntil = 0;
        elapsed = 0;
        setBreakSecondsLeft(0);
      } else {
        setBreakSecondsLeft(0);
        if (wasVisible) elapsed += Math.max(0, (now - lastTick) / 1000);
        if (elapsed >= studyIntervalSeconds) {
          elapsed = 0;
          breakUntil = now + breakDurationSeconds * 1000;
          setBreakSecondsLeft(breakDurationSeconds);
        }
        setStudiedSeconds(elapsed);
      }
      localStorage.setItem(`lumilearn:break:${studentEmail}`, JSON.stringify({ studiedSeconds: elapsed, breakUntil }));
      lastTick = now;
      wasVisible = document.visibilityState === "visible";
    };
    const resetVisibleInterval = () => {
      lastTick = Date.now();
      wasVisible = document.visibilityState === "visible";
    };
    setStudiedSeconds(elapsed);
    setBreakSecondsLeft(Math.max(0, Math.ceil((breakUntil - Date.now()) / 1000)));
    const interval = window.setInterval(updateTimer, 1000);
    document.addEventListener("visibilitychange", resetVisibleInterval);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", resetVisibleInterval);
    };
  }, [screen, studentEmail]);
  useEffect(() => {
    if (!studentEmail) return;
    const key = `lumilearn:money:${studentEmail}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (typeof parsed !== "object" || parsed === null || !("allowance" in parsed) || !("spent" in parsed) || !("saved" in parsed)) {
          throw new Error("Saved money planner data is invalid.");
        }
        setMoneyAmounts({
          allowance: String(parsed.allowance),
          spent: String(parsed.spent),
          saved: String(parsed.saved),
        });
      } catch (error) {
        console.error("Could not load saved money planner data:", error);
        setMoneyAmounts({ allowance: "", spent: "", saved: "" });
      }
    } else {
      setMoneyAmounts({ allowance: "", spent: "", saved: "" });
    }
    setMoneyLoadedFor(studentEmail);
  }, [studentEmail]);
  useEffect(() => {
    if (!studentEmail || moneyLoadedFor !== studentEmail) return;
    localStorage.setItem(`lumilearn:money:${studentEmail}`, JSON.stringify(moneyAmounts));
  }, [moneyAmounts, moneyLoadedFor, studentEmail]);
  const availableSubjects = useMemo(
    () => Array.from(new Set([...subjectOptionsFor(studentStandard), ...selectedSubjects])),
    [selectedSubjects, studentStandard],
  );
  const visibleCourses = useMemo(
    () => selectedSubjects.map((subject, index) => ({
      subject,
      title: courseTitleFor(subject, studentStandard),
      lessons: 12 + index * 3,
      progress: courseProgress[index % courseProgress.length],
      ...courseStyles[index % courseStyles.length],
      avatar: subject.slice(0, 2).toUpperCase(),
      teacher: courseTeachers[index % courseTeachers.length],
    })).filter((course) => {
      const matchesSearch = `${course.title} ${course.subject}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = courseFilter === "All"
        || (courseFilter === "In Progress" && course.progress > 0 && course.progress < 100)
        || (courseFilter === "Completed" && course.progress === 100);
      return matchesSearch && matchesFilter;
    }),
    [courseFilter, searchQuery, selectedSubjects, studentStandard],
  );
  const secondsUntilBreak = Math.ceil(Math.max(0, studyIntervalSeconds - studiedSeconds));
  const changeStandard = (standard: string) => {
    setStudentStandard(standard);
    const options = subjectOptionsFor(standard);
    setSelectedSubjects((current) => {
      const matching = current.filter((subject) => options.includes(subject));
      return matching.length ? matching : options.slice(0, 2);
    });
  };
  const loadSession = (session: Session) => {
    setStudentName(session.profile.name);
    setStudentStandard(session.profile.standard);
    setStudentEmail(session.user.email);
    setSelectedSubjects(session.profile.subjects);
    setStudyGoal(session.profile.dailyGoal);
    const timerState = loadBreakState(session.user.email);
    setStudiedSeconds(timerState.studiedSeconds);
    setBreakSecondsLeft(Math.max(0, Math.ceil((timerState.breakUntil - Date.now()) / 1000)));
    setTasks(session.tasks);
    setMessages(session.messages.length ? session.messages : [{
      id: "welcome",
      role: "assistant",
      text: `Hi ${session.profile.name}! I’m your Gemini study tutor. What are you working on today?`,
      createdAt: new Date().toISOString(),
    }]);
    setScreen("dashboard");
    setApiError("");
  };
  useEffect(() => {
    let active = true;
    api.health().then((status) => {
      if (!active) return;
      setHealthChecked(true);
      setAiConfigured(status.aiConfigured);
      setAiModel(status.model);
    }).catch((error: Error) => {
      if (active) {
        setHealthChecked(true);
        setApiError(`Backend is unavailable: ${error.message}`);
      }
    });
    api.currentSession().then((session) => {
      if (active) loadSession(session);
    }).catch((error: Error) => {
      if (!active) return;
      if (error.message !== "Please sign in to continue.") setApiError(`Backend is unavailable: ${error.message}`);
      setScreen("landing");
    });
    return () => { active = false; };
  }, []);

  const sendMessage = async (text: string) => {
    const question = text.trim();
    if (!question || chatBusy || chatCooldownSeconds > 0) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: question, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, userMessage]);
    setChatDraft("");
    setChatError("");
    setFailedQuestion("");
    setChatBusy(true);
    try {
      const response = await api.sendMessage(question, language);
      setMessages((current) => [...current, response.message]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tutor request failed.";
      setChatError(message);
      if (message.toLowerCase().includes("request limit") || message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("too many tutor requests")) {
        setChatCooldownUntil(Date.now() + 60_000);
      }
      setFailedQuestion(question);
    } finally {
      setChatBusy(false);
    }
  };
  const askForGuidance = (topic: "daily-plan" | "money" | "career") => {
    const context = `The student is in ${studentStandard} and studies ${selectedSubjects.join(", ") || "their school subjects"}.`;
    const prompts = {
      "daily-plan": `Help me plan a realistic school day in 5 clear steps. ${context} Include time for classes, homework, meals, rest, physical movement, and hobbies. Ask me for my school hours if you need them; do not invent a fixed timetable.`,
      money: `Teach me age-appropriate personal money management: how to track pocket money, separate needs from wants, and set a small savings goal. ${context} Give a simple example, avoid investment advice, and do not ask for private financial details.`,
      career: `Help me explore 3 career or job paths that may fit my interests and subjects. ${context} For each, explain what people do, useful skills to try, and one low-cost next step I can take at my age. Do not promise employment or earnings.`,
    };
    setPlannerOpen(false);
    setTutorOpen(true);
    void sendMessage(prompts[topic]);
  };
  const navigateToSection = (label: string) => {
    setActiveSection(label);
    setMobileNavOpen(false);
    if (label === "Schedule" || label === "Assignments") setPlannerOpen(true);
    if (label === "Messages") setTutorOpen(true);
    if (label === "Settings") setSettingsOpen(true);
    if (label === "Community") setCommunityOpen(true);
    if (label === "Overview") window.scrollTo({ top: 0, behavior: "smooth" });
    if (label === "My Learning" || label === "Courses") document.getElementById("continue-learning")?.scrollIntoView({ behavior: "smooth" });
    if (label === "Achievements") document.getElementById("achievements")?.scrollIntoView({ behavior: "smooth" });
  };

  const submitSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setApiError("");
    try {
      loadSession(await api.signIn(studentEmail, studentPassword));
      setStudentPassword("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setAuthBusy(false);
    }
  };
  const submitSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setApiError("");
    try {
      loadSession(await api.signUp({ name: studentName, standard: studentStandard, email: studentEmail, password: studentPassword, subjects: selectedSubjects, dailyGoal: studyGoal }));
      setStudentPassword("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Account creation failed.");
    } finally {
      setAuthBusy(false);
    }
  };
  const addTask = async (title: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle || taskBusy) return;
    setTaskBusy(true);
    setApiError("");
    try {
      const task = await api.createTask(cleanTitle, dueDateDraft, reasonDraft);
      setTasks((current) => [...current, task]);
      setTaskDraft("");
      setReasonDraft("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not add task.");
    } finally {
      setTaskBusy(false);
    }
  };
  const openPlannerForDate = (date: string) => {
    setSelectedCalendarDate(date);
    setDueDateDraft(date);
    setPlannerOpen(true);
  };
  const moveCalendarMonth = (offset: number) => {
    const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1);
    setCalendarMonth(nextMonth);
    setSelectedCalendarDate(toDateKey(nextMonth));
  };
  const calendarDays = (() => {
    const offset = (calendarMonth.getDay() + 6) % 7;
    const totalDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const cells = Array.from({ length: offset + totalDays }, (_, index) => index < offset ? null : new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - offset + 1));
    while (cells.length % 7) cells.push(null);
    return cells;
  })();
  const toggleTask = async (task: StudyTask) => {
    setApiError("");
    try {
      const updatedTask = await api.updateTask(task.id, { done: !task.done });
      setTasks((current) => current.map((entry) => entry.id === updatedTask.id ? updatedTask : entry));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not update task.");
    }
  };
  const removeTask = async (taskId: string) => {
    setApiError("");
    try {
      await api.deleteTask(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not remove task.");
    }
  };
  const saveProfile = async () => {
    setProfileBusy(true);
    setApiError("");
    try {
      const profile = await api.updateProfile({ name: studentName, standard: studentStandard, subjects: selectedSubjects, dailyGoal: studyGoal });
      setStudentName(profile.name);
      setStudentStandard(profile.standard);
      setSelectedSubjects(profile.subjects);
      setStudyGoal(profile.dailyGoal);
      setSettingsOpen(false);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setProfileBusy(false);
    }
  };
  const signOut = async () => {
    setApiError("");
    try {
      await api.signOut();
      setScreen("landing");
      setTasks([]);
      setMessages([]);
      setStudentPassword("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not sign out.");
    }
  };

  if (screen === "loading") {
    return <div className="flex min-h-screen items-center justify-center bg-[#f2f1f5] text-sm font-medium text-[#68677b]">Connecting to ThriveMate…</div>;
  }

  if (screen !== "dashboard") {
    return (
      <div className="min-h-screen bg-[#f2f1f5] p-4 md:p-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(63,52,119,0.12)] ring-1 ring-[#e9e6f0] lg:flex-row">
          <section className="flex flex-1 flex-col p-6 md:p-10">
            <button onClick={() => setScreen("landing")} className="flex w-fit items-center gap-2 text-left" aria-label="ThriveMate home">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7b65ee] to-[#8a87ff] text-white"><Sparkles className="h-5 w-5" /></span>
              <span className="text-xl font-bold tracking-tight text-[#242238]">ThriveMate</span>
            </button>
            {screen === "landing" && (
              <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_0.85fr]">
                <div>
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#f1edff] px-4 py-2 text-sm font-medium text-[#604bd6]"><Sparkles className="h-4 w-4" /> Your personal AI study companion</div>
                  <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-[#202033] md:text-6xl">Make every study session <span className="text-[#7059e8]">count.</span></h1>
                  <p className="mt-5 max-w-lg text-lg leading-8 text-[#707184]">Keep your courses, study plan, and helpful tutoring in one calm space built around your goals.</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button onClick={() => setScreen("onboarding")} className="rounded-2xl bg-[#6f5ae8] px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-[#5944d1]">Get started free</button>
                    <button onClick={() => setScreen("signin")} className="rounded-2xl border border-[#e5e3ec] bg-white px-6 py-3.5 font-semibold text-[#37364a] hover:bg-[#faf9fc]">Sign in</button>
                  </div>
                  <p className="mt-4 text-xs text-[#89899a]">Free student account · Your learning details are saved to your account</p>
                </div>
                <div className="rounded-[28px] bg-gradient-to-br from-[#f0edff] via-[#faf7ff] to-[#e3f5ee] p-6 md:p-8">
                  <div className="rounded-[22px] bg-white p-5 shadow-xl shadow-violet-100">
                    <div className="flex items-center justify-between"><div><p className="text-sm text-[#7b7b8c]">Your progress this week</p><p className="mt-1 text-3xl font-bold text-[#242238]">18.6 hours</p></div><span className="rounded-full bg-[#e5f7ed] px-3 py-1.5 text-sm font-semibold text-[#388361]">↑ 12%</span></div>
                    <div className="mt-7 flex h-32 items-end gap-3">{weekBars.map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t-xl ${index === 3 ? "bg-[#7059e8]" : "bg-[#cbbfff]"}`} style={{ height: `${height * 10}px` }} /><span className="text-xs text-[#858597]">{["M", "T", "W", "T", "F", "S", "S"][index]}</span></div>)}</div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 rounded-[20px] bg-white/90 p-4 shadow-md shadow-violet-100"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ede8ff] text-[#6a54df]"><BookOpen className="h-5 w-5" /></span><div><p className="font-semibold text-[#28273a]">Small steps. Real progress.</p><p className="text-sm text-[#7b7b8c]">Your plan adapts to your learning goals.</p></div></div>
                </div>
              </div>
            )}
            {screen === "signin" && (
              <div className="flex flex-1 items-center justify-center py-10">
                <form onSubmit={submitSignIn} className="w-full max-w-md">
                  <h1 className="text-3xl font-bold text-[#242238]">Welcome back</h1>
                  <p className="mt-2 text-[#777789]">Sign in to continue your learning journey.</p>
                  <label className="mt-7 block text-sm font-medium text-[#454458]">Email</label>
                  <input required autoComplete="username" type="email" value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-2xl border border-[#e5e3ec] bg-[#fcfbfd] px-4 py-3 outline-none focus:border-[#a99bec]" />
                  <label className="mt-4 block text-sm font-medium text-[#454458]">Password</label>
                  <input required autoComplete="current-password" minLength={8} maxLength={128} type="password" value={studentPassword} onChange={(event) => setStudentPassword(event.target.value)} placeholder="Your password" className="mt-2 w-full rounded-2xl border border-[#e5e3ec] bg-[#fcfbfd] px-4 py-3 outline-none focus:border-[#a99bec]" />
                  {apiError && <p role="alert" className="mt-4 rounded-xl bg-[#fff0ef] p-3 text-sm text-[#a9322b]">{apiError}</p>}
                  <button disabled={authBusy} className="mt-6 w-full rounded-2xl bg-[#6f5ae8] px-5 py-3.5 font-semibold text-white hover:bg-[#5944d1] disabled:opacity-60">{authBusy ? "Signing in…" : "Sign in"}</button>
                  <p className="mt-6 text-center text-sm text-[#777789]">New to ThriveMate? <button type="button" onClick={() => { setApiError(""); setScreen("onboarding"); }} className="font-semibold text-[#604bd6]">Create an account</button></p>
                </form>
              </div>
            )}
            {screen === "onboarding" && (
              <div className="flex flex-1 items-center justify-center py-10">
                <form onSubmit={submitSignUp} className="w-full max-w-2xl">
                  <div className="mb-3 text-sm font-semibold text-[#7059e8]">CREATE YOUR STUDENT ACCOUNT</div>
                  <h1 className="text-3xl font-bold text-[#242238]">Let’s set up your learning space.</h1>
                  <p className="mt-2 text-[#777789]">Your email and password let you sign in and keep your study progress.</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div><label className="block text-sm font-medium text-[#454458]">Full name</label><input required autoComplete="name" maxLength={80} value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Your name" className="mt-2 w-full rounded-2xl border border-[#e5e3ec] bg-[#fcfbfd] px-4 py-3 outline-none focus:border-[#a99bec]" /></div>
                    <div><label htmlFor="student-standard" className="block text-sm font-medium text-[#454458]">Class / standard</label><select id="student-standard" required value={studentStandard} onChange={(event) => changeStandard(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#e5e3ec] bg-[#fcfbfd] px-4 py-3 outline-none focus:border-[#a99bec]"><option value="" disabled>Select your class</option>{Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`).map((grade) => <option key={grade} value={grade}>{grade}</option>)}<option value="Undergraduate">Undergraduate</option><option value="Postgraduate">Postgraduate</option><option value="Other">Other</option></select></div>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div><label className="block text-sm font-medium text-[#454458]">Email address</label><input required autoComplete="email" type="email" maxLength={254} value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-2xl border border-[#e5e3ec] bg-[#fcfbfd] px-4 py-3 outline-none focus:border-[#a99bec]" /></div>
                    <div><label className="block text-sm font-medium text-[#454458]">Password</label><input required autoComplete="new-password" type="password" minLength={8} maxLength={128} value={studentPassword} onChange={(event) => setStudentPassword(event.target.value)} placeholder="At least 8 characters" className="mt-2 w-full rounded-2xl border border-[#e5e3ec] bg-[#fcfbfd] px-4 py-3 outline-none focus:border-[#a99bec]" /><p className="mt-1 text-xs text-[#858597]">Use 8 or more characters.</p></div>
                  </div>
                  <p className="mt-6 text-sm font-medium text-[#454458]">Choose your {studentStandard} subjects</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {availableSubjects.map((subject) => {
                      const selected = selectedSubjects.includes(subject);
                      return <button key={subject} type="button" onClick={() => setSelectedSubjects((current) => selected ? current.filter((item) => item !== subject) : [...current, subject])} className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${selected ? "border-[#8e7be9] bg-[#f1edff] text-[#5845cb]" : "border-[#e8e6ed] bg-white text-[#666679] hover:border-[#c7c0e7]"}`}>{selected ? "✓ " : ""}{translate(subject, language)}</button>;
                    })}
                  </div>
                  <p className="mt-6 text-sm font-medium text-[#454458]">Set a realistic daily study goal</p>
                  <div className="mt-3 flex flex-wrap gap-2">{["30 min a day", "1 hour a day", "2 hours a day"].map((goal) => <button key={goal} type="button" onClick={() => setStudyGoal(goal)} className={`rounded-full border px-4 py-2 text-sm ${studyGoal === goal ? "border-[#8e7be9] bg-[#f1edff] font-semibold text-[#5845cb]" : "border-[#e8e6ed] text-[#666679]"}`}>{goal}</button>)}</div>
                  {apiError && <p role="alert" className="mt-4 rounded-xl bg-[#fff0ef] p-3 text-sm text-[#a9322b]">{apiError}</p>}
                  <button disabled={authBusy || selectedSubjects.length === 0} className="mt-7 w-full rounded-2xl bg-[#6f5ae8] px-5 py-3.5 font-semibold text-white hover:bg-[#5944d1] disabled:cursor-not-allowed disabled:opacity-50">{authBusy ? "Creating your account…" : "Create my account"}</button>
                  <p className="mt-4 text-center text-sm text-[#777789]">Already have an account? <button type="button" onClick={() => { setApiError(""); setScreen("signin"); }} className="font-semibold text-[#604bd6]">Sign in</button></p>
                </form>
              </div>
            )}
          </section>
          <aside className="hidden w-[310px] flex-col justify-between bg-[#f5f2f9] p-8 lg:flex">
            <div><div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7665d8]">Learn at your pace</div><h2 className="mt-5 text-3xl font-semibold leading-snug text-[#28263b]">A little progress each day adds up.</h2><p className="mt-4 leading-7 text-[#777789]">Build a routine, get unstuck with your tutor, and keep your next steps clear.</p></div>
            <div className="space-y-3 text-sm text-[#56556a]"><p className="rounded-2xl bg-white p-4">✓ Track your courses and progress</p><p className="rounded-2xl bg-white p-4">✓ Plan study sessions that fit your day</p><p className="rounded-2xl bg-white p-4">✓ Get step-by-step demo tutoring</p></div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef0f1] p-4 md:p-8">
      <div className="mx-auto flex max-w-[1380px] gap-6 rounded-[32px] bg-[#f3f2f4] p-4 shadow-[0_30px_70px_rgba(74,87,121,0.12)] ring-1 ring-[#e3e5eb] lg:p-5">
        <aside className="hidden w-[260px] shrink-0 rounded-[28px] bg-[#f5f2f9] p-5 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7b65ee] to-[#8a87ff] text-white shadow-lg shadow-violet-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-[1.75rem] font-[700] tracking-[-0.04em] text-[#1e1e2b]">ThriveMate</div>
          </div>

          <nav className="mt-7 space-y-1.5">
            {sidebarItems.map(({ label, active, icon: Icon, badge }) => (
              <button
                key={label}
                onClick={() => navigateToSection(label)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[0.95rem] transition ${
                  activeSection === label ? "bg-white text-[#2d2d39] shadow-sm ring-1 ring-[#eceaf3]" : "text-[#3d3d49] hover:bg-white/40"
                }`}
              >
                <div className={`flex h-5 w-5 items-center justify-center ${activeSection === label ? "text-[#5b48d4]" : "text-[#6c6c77]"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="flex-1 font-medium">{label}</span>
                {badge ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1f2030] px-1.5 text-[0.65rem] font-semibold text-white">
                    {badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="mt-7 rounded-[24px] bg-[#f4eaf5] p-4 shadow-inner shadow-white/60 ring-1 ring-[#ece5ef]">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8d70ff] to-[#f5a4c7] text-white shadow-md shadow-violet-200">
              <Crown className="h-7 w-7" />
            </div>
            <div className="text-[1.05rem] font-semibold text-[#1e1e2b]">Go Premium</div>
            <div className="mt-2 text-sm leading-5 text-[#5a5b65]">Unlock unlimited courses, certificates and more.</div>
            <button className="mt-4 w-full rounded-2xl bg-[#1d1e35] px-3 py-3 text-sm font-semibold text-white transition hover:bg-[#11152b]">
              Upgrade Now
            </button>
          </div>
        </aside>

        <main className="flex-1 rounded-[28px] bg-[#f4f4f6] p-4 md:p-5">
          <header className="flex flex-wrap items-center justify-between gap-4 pb-4">
            <div className="flex items-center gap-3">
              <button aria-label="Open navigation" onClick={() => setMobileNavOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f1fe] text-[#5c4eea] ring-1 ring-[#e8e1ff] lg:hidden">
                <PanelLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="text-[1.1rem] font-semibold text-[#1d1d2a]">{translate("Good morning", language)}, {studentName}! 👋</div>
                <div className="text-sm text-[#767a88]">{studentStandard} · {selectedSubjects.join(" · ") || "Choose your study subjects"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d8f9a]" />
                <input
                  className="w-[280px] rounded-full border border-[#e6e8ee] bg-[#fafafc] py-2.5 pl-9 pr-4 text-sm text-[#22242d] placeholder:text-[#8d8f9a] outline-none transition focus:border-[#d5d8f7]"
                  placeholder="Search for courses, topics..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <button onClick={() => setTutorOpen(true)} className="rounded-full bg-[#6f5ae8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5944d1]">
                Ask AI Tutor
              </button>
              <button onClick={() => setNotificationsOpen(true)} aria-label="Open notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e3e5ec] bg-white text-[#44485f] shadow-sm hover:bg-[#f7f7fb]">
                <Bell className="h-4 w-4" />
                {tasks.some((task) => !task.done) && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#7059e8] ring-2 ring-white" />}
              </button>
              <button onClick={() => setSettingsOpen(true)} aria-label="Open account settings" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_30%,_#f9d1a2,_#d69d86_30%,_#4a3147_60%,_#1c212e_100%)] text-sm font-bold text-white ring-2 ring-white">{studentName.slice(0, 1).toUpperCase()}</button>
            </div>
          </header>
          {!healthChecked && <div role="status" className="mb-4 rounded-2xl bg-[#fff9e8] px-4 py-3 text-sm text-[#86630d]">Connecting to the ThriveMate backend…</div>}
          {apiError && <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a9322b]"><span>{apiError}</span><button aria-label="Dismiss error" onClick={() => setApiError("")} className="rounded-full px-2 py-1 font-semibold hover:bg-white">×</button></div>}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {healthChecked && <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${aiConfigured ? "bg-[#e5f7ed] text-[#388361]" : "bg-[#fff4dd] text-[#8a5c0a]"}`}><span className={`h-2 w-2 rounded-full ${aiConfigured ? "bg-[#43ad79]" : "bg-[#e0a52d]"}`} />{aiConfigured ? `Gemini configured · ${aiModel}` : "Gemini needs a key · see .env setup"}</div>}
            <div className="min-w-56 rounded-full bg-white px-4 py-2 text-xs text-[#5f6070] ring-1 ring-[#e9e7ec]" role="status" aria-live="polite">
              <div className="mb-1 flex items-center justify-between gap-3">
                <span>{translate(breakSecondsLeft > 0 ? "Break time" : "Time until your next break", language)}</span>
                <span className="font-mono font-semibold tabular-nums text-[#5c4eea]">{breakSecondsLeft > 0 ? `${Math.floor(breakSecondsLeft / 60)}:${String(breakSecondsLeft % 60).padStart(2, "0")}` : `${Math.floor(secondsUntilBreak / 60)}:${String(secondsUntilBreak % 60).padStart(2, "0")}`}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#eeecf4]">
                <div className={`h-full rounded-full transition-[width] ${breakSecondsLeft > 0 ? "bg-[#2d8d61]" : "bg-[#7059e8]"}`} style={{ width: `${breakSecondsLeft > 0 ? (1 - breakSecondsLeft / breakDurationSeconds) * 100 : (studiedSeconds / studyIntervalSeconds) * 100}%` }} />
              </div>
            </div>
          </div>

          {!isLifeToolsPage && <div className="grid gap-5 xl:grid-cols-[1.9fr_1fr]">
            <div className="space-y-5">
              <section id="continue-learning" className="rounded-[26px] bg-[#f7f5f8] p-5 ring-1 ring-[#e9e7ec]">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[1.05rem] font-semibold text-[#1d1d2a]">{translate("Your Learning Activity", language)}</h2>
                  <button className="flex items-center gap-2 rounded-full border border-[#e2e4ea] bg-white px-2.5 py-1.5 text-xs font-medium text-[#5e6071] shadow-sm">
                    This Week <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mb-3 flex items-center gap-2 text-sm text-[#4ea98d]">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#4ea98d]" />
                  <span className="font-medium">{translate("12% more than last week", language)}</span>
                </div>

                <div className="mb-5 flex items-end gap-4">
                  <div className="text-[2.2rem] font-semibold tracking-[-0.05em] text-[#1d1d2a]">18.6</div>
                  <div className="pb-1 text-sm text-[#666b7a]">{translate("Hours spent", language)}</div>
                </div>

                <div className="flex h-32 items-end gap-3">
                  {weekBars.map((value, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
                      <div
                        className={`w-full rounded-t-[14px] ${index === 3 ? "bg-[#6f5ae8]" : "bg-[#c8b8ff]"}`}
                        style={{ height: `${value * 18}px` }}
                      />
                      <div className="text-xs text-[#7a7d8d]">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[26px] bg-[#f7f5f8] p-5 ring-1 ring-[#e9e7ec]">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-[1.05rem] font-semibold text-[#1d1d2a]">{translate("Continue Learning", language)}</h2>
                    <p className="mt-1 text-xs text-[#777b89]">Learning recommendations for {studentStandard}, based on your subjects.</p>
                  </div>
                  <button onClick={() => { setCourseFilter("All"); document.getElementById("continue-learning")?.scrollIntoView({ behavior: "smooth" }); }} className="text-sm font-medium text-[#5c4eea]">{translate("View All", language)}</button>
                </div>

                <div className="mb-4 flex gap-2 text-sm">
                  {["All", "In Progress", "Completed"].map((filter) => (
                    <button key={filter} onClick={() => setCourseFilter(filter)} className={`pb-1 ${courseFilter === filter ? "border-b-2 border-[#6f5ae8] font-medium text-[#1d1d2a]" : "text-[#7c7e8a]"}`}>{translate(filter, language)}</button>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {visibleCourses.map((course) => (
                    <article key={course.title} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-[#eae5ec] shadow-sm">
                      <div className={`relative h-[120px] ${course.color}`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,_rgba(255,255,255,0.95),_transparent_18%),radial-gradient(circle_at_70%_30%,_rgba(255,255,255,0.8),_transparent_20%)]" />
                        <div className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 text-[0.64rem] font-bold text-[#4d3d8d] shadow-sm">
                          &lt;/&gt;
                        </div>
                        <div className="absolute bottom-5 left-5 flex h-6 w-6 items-center justify-center rounded-full bg-white/75 shadow-sm text-[0.62rem] font-bold text-[#1d1d2a]">
                          {course.avatar}
                        </div>
                        <div className="absolute right-4 top-4 h-7 w-16 rounded-full bg-white/70" />
                        <div className="absolute right-5 top-10 h-8 w-12 rounded-[10px] bg-white/60" />
                        <div className="absolute bottom-5 right-5 h-10 w-16 rounded-[12px] bg-white/60" />
                        <div className="absolute bottom-2 left-1/2 h-2 w-12 -translate-x-1/2 rounded-full bg-white/60" />
                      </div>

                      <div className="p-4">
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <div className="text-[0.9rem] font-semibold text-[#1d1d2a]">{translate(course.title, language)}</div>
                          <div className="rounded-full bg-[#f3f1f6] px-2 py-1 text-[0.68rem] font-semibold text-[#5a4dcb]">{course.progress}%</div>
                        </div>

                        <div className="mb-4 h-2 rounded-full bg-[#efeef4]">
                          <div className={`h-full rounded-full ${course.accent}`} style={{ width: `${course.progress}%` }} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f3d5c8] text-[0.58rem] font-semibold text-[#5a463f]">{course.avatar}</div>
                            <div className="text-[0.82rem] text-[#5a5d69]">{course.teacher}</div>
                          </div>
                          <div className="text-[0.78rem] text-[#5b5d6b]">{course.lessons} Lessons</div>
                        </div>
                      </div>
                    </article>
                  ))}
                  {visibleCourses.length === 0 && <p className="col-span-full py-8 text-center text-sm text-[#7c7e8a]">No courses match this search.</p>}
                </div>
              </section>

              <section className="rounded-[26px] bg-[#f7f5f8] p-5 ring-1 ring-[#e9e7ec]">
                <div className="mb-4">
                  <h2 className="text-[1.05rem] font-semibold text-[#1d1d2a]">{translate("Study & Life Tools", language)}</h2>
                  <p className="mt-1 text-xs text-[#777b89]">{studentStandard} · {selectedSubjects.join(", ")}</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <article className="rounded-2xl bg-white p-4 ring-1 ring-[#eceaf3]">
                    <CalendarDays className="h-5 w-5 text-[#6f5ae8]" />
                    <h3 className="mt-3 font-semibold text-[#29283b]">{translate("Daily Life Planner", language)}</h3>
                    <p className="mt-2 min-h-12 text-sm leading-5 text-[#777b89]">{translate("Create a balanced routine for school, homework, rest, and your priorities.", language)}</p>
                    <button onClick={() => setActiveSection("Daily Life Planner")} className="mt-3 rounded-xl bg-[#f1edff] px-3 py-2 text-sm font-semibold text-[#5845cb]">{translate("Open planner page", language)}</button>
                  </article>
                  <article className="rounded-2xl bg-white p-4 ring-1 ring-[#eceaf3]">
                    <PiggyBank className="h-5 w-5 text-[#2d8d61]" />
                    <h3 className="mt-3 font-semibold text-[#29283b]">{translate("Money Manager", language)}</h3>
                    <p className="mt-2 text-sm leading-5 text-[#777b89]">{translate("Track allowance, spending, and savings privately on this device.", language)}</p>
                    <button onClick={() => setActiveSection("Money Manager")} className="mt-3 rounded-xl bg-[#e8f7ed] px-3 py-2 text-sm font-semibold text-[#287c52]">{translate("Open money page", language)}</button>
                  </article>
                  <article className="rounded-2xl bg-white p-4 ring-1 ring-[#eceaf3]">
                    <BriefcaseBusiness className="h-5 w-5 text-[#c88210]" />
                    <h3 className="mt-3 font-semibold text-[#29283b]">{translate("Career & Job Guide", language)}</h3>
                    <p className="mt-2 min-h-12 text-sm leading-5 text-[#777b89]">{translate("Explore age-appropriate career paths related to your interests and subjects.", language)}</p>
                    <button onClick={() => setActiveSection("Career & Job Guide")} className="mt-3 rounded-xl bg-[#fff4dd] px-3 py-2 text-sm font-semibold text-[#8a5c0a]">{translate("Open career page", language)}</button>
                  </article>
                </div>
              </section>

              <section className="rounded-[26px] bg-[#f7f5f8] p-5 ring-1 ring-[#e9e7ec]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[1.05rem] font-semibold text-[#1d1d2a]">{translate("Quick Stats", language)}</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                  {[
                    { value: selectedSubjects.length, label: "My Subjects", color: "bg-[#e8e2ff] text-[#5849d5]" },
                    { value: tasks.filter((task) => task.done).length, label: "Tasks Completed", color: "bg-[#dff4ea] text-[#2d8d61]" },
                    { value: tasks.filter((task) => !task.done).length, label: "Upcoming Tasks", color: "bg-[#fff1de] text-[#c88210]" },
                    { value: studentStandard, label: "My Class", color: "bg-[#e9f1ff] text-[#4f80cc]" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-[22px] bg-white p-4 ring-1 ring-[#ece9f1]">
                      <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="text-[1.5rem] font-semibold tracking-[-0.05em] text-[#1d1d2a]">{stat.value}</div>
                      <div className="mt-1 text-sm text-[#707586]">{translate(stat.label, language)}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <aside className="rounded-[26px] bg-[#f7f5f8] p-5 ring-1 ring-[#e9e7ec]">
                <div className="mb-5 flex items-center justify-between">
                  <div className="text-[0.9rem] font-semibold text-[#1d1d2a]">{translate("Learning Progress", language)}</div>
                  <button className="rounded-full border border-[#e2e4ea] bg-white px-2.5 py-1 text-[0.7rem] font-medium text-[#5c6071]">Overall</button>
                </div>

                <div className="mb-5 flex items-center justify-center">
                  <div
                    className="relative flex h-28 w-28 items-center justify-center rounded-full"
                    style={{
                      background: "conic-gradient(#6854ea 0 68%, #e6e7ef 68% 100%)",
                    }}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f7f5f8] text-[1.6rem] font-semibold text-[#1d1d2a]">68%</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Completed", value: 24, color: "bg-[#ede8ff] text-[#5b48d4]", icon: CircleCheckBig },
                    { label: "In Progress", value: 8, color: "bg-[#e8f3ff] text-[#4994d6]", icon: BookOpen },
                    { label: "Upcoming", value: 6, color: "bg-[#eaf8ec] text-[#3c9f72]", icon: CalendarDays },
                  ].map((entry) => (
                    <div key={entry.label} className="flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-[#ebedf2]">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${entry.color}`}>
                          <entry.icon className="h-4 w-4" />
                        </div>
                        <div className="text-[1.1rem] font-semibold text-[#1d1d2a]">{entry.value}</div>
                      </div>
                      <div className="text-sm text-[#707585]">{entry.label}</div>
                      <button onClick={() => { setCourseFilter(entry.label === "Completed" ? "Completed" : "In Progress"); document.getElementById("continue-learning")?.scrollIntoView({ behavior: "smooth" }); }} className="text-xs font-medium text-[#5c4eea]">Details</button>
                    </div>
                  ))}
                </div>
              </aside>

              <div className="rounded-[26px] bg-[#f7f5f8] p-5 ring-1 ring-[#e9e7ec]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[0.95rem] font-semibold text-[#1d1d2a]">Profile</div>
                  <button onClick={() => setSettingsOpen(true)} className="text-sm text-[#6b6f80]">Edit</button>
                </div>

                <div className="flex items-center gap-3 rounded-[20px] bg-white p-3 ring-1 ring-[#eceaf3]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,_#f9d0a5,_#d07d80_35%,_#2b2d39_75%)] ring-2 ring-white shadow-sm" />
                  <div>
                    <div className="text-[1.05rem] font-semibold text-[#1d1d2a]">{studentName}</div>
                    <div className="text-sm text-[#686d7a]">{studentStandard} · {selectedSubjects[0] || "Student"}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[#5a5e6d]">
                  <span className="text-[#f4bd3d]">★</span>
                  <span className="font-medium">Level 12</span>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <button aria-label="Previous month" onClick={() => moveCalendarMonth(-1)} className="rounded-lg px-2 py-1 text-[#5c4eea] hover:bg-white">‹</button>
                  <h3 className="text-sm font-semibold text-[#343442]">{calendarMonth.toLocaleDateString(language === "Hindi" ? "hi-IN" : "en", { month: "long", year: "numeric" })}</h3>
                  <button aria-label="Next month" onClick={() => moveCalendarMonth(1)} className="rounded-lg px-2 py-1 text-[#5c4eea] hover:bg-white">›</button>
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs text-[#697081]">
                  {(language === "Hindi" ? ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]).map((day) => <div key={day} className="py-1 font-medium">{day}</div>)}
                  {calendarDays.map((date, index) => {
                    if (!date) return <span key={`empty-${index}`} />;
                    const dateKey = toDateKey(date);
                    const hasTasks = tasks.some((task) => task.dueDate === dateKey);
                    return (
                      <button
                        key={dateKey}
                        aria-label={`${date.toLocaleDateString(language === "Hindi" ? "hi-IN" : "en", { dateStyle: "full" })}${hasTasks ? ", scheduled tasks" : ""}`}
                        aria-pressed={selectedCalendarDate === dateKey}
                        onClick={() => setSelectedCalendarDate(dateKey)}
                        className={`relative rounded-lg py-1.5 text-sm ${selectedCalendarDate === dateKey ? "bg-[#6f5ae8] font-semibold text-white" : date.getMonth() === calendarMonth.getMonth() ? "text-[#4b4e5e] hover:bg-white" : "text-[#b5b5c0]"}`}
                      >
                        {date.getDate()}
                        {hasTasks && <span className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${selectedCalendarDate === dateKey ? "bg-white" : "bg-[#6f5ae8]"}`} />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 border-t border-[#e7e4ec] pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#343442]">{new Date(`${selectedCalendarDate}T12:00:00`).toLocaleDateString(language === "Hindi" ? "hi-IN" : "en", { month: "short", day: "numeric", year: "numeric" })}</h3>
                    <button onClick={() => openPlannerForDate(selectedCalendarDate)} className="rounded-lg bg-[#f1edff] px-2.5 py-1.5 text-xs font-semibold text-[#5845cb]">Schedule</button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {tasks.filter((task) => task.dueDate === selectedCalendarDate).map((task) => (
                      <div key={task.id} className="rounded-xl bg-white p-2.5 text-xs">
                        <p className={`font-medium text-[#343442] ${task.done ? "line-through opacity-60" : ""}`}>{task.title}</p>
                        {task.reason && <p className="mt-1 text-[#777b89]">{task.reason}</p>}
                      </div>
                    ))}
                    {tasks.every((task) => task.dueDate !== selectedCalendarDate) && <p className="text-xs text-[#777b89]">No tasks scheduled for this date.</p>}
                  </div>
                </div>
              </div>

              <aside id="achievements" className="rounded-[26px] bg-[#f7f5f8] p-5 ring-1 ring-[#e9e7ec]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[0.95rem] font-semibold text-[#1d1d2a]">{translate("Today’s Plan", language)}</div>
                  <button onClick={() => setPlannerOpen(true)} aria-label="Add a task" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg text-[#5a5d6a] shadow-sm ring-1 ring-[#eceaf3]">+</button>
                </div>

                <div className="space-y-3 text-[0.95rem]">
                  {tasks.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-[18px] bg-white p-3 ring-1 ring-[#eceaf3]">
                      <button aria-label={`Mark ${item.title} ${item.done ? "incomplete" : "complete"}`} onClick={() => void toggleTask(item)} className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] ${item.done ? "bg-[#6f5ae8] text-white" : "border border-[#c8c9d2] bg-white"}`}>
                        {item.done ? <CheckCheck className="h-3 w-3" /> : null}
                      </button>
                      <div className="flex-1">
                        <div className={`font-medium text-[#1d1d2a] ${item.done ? "line-through opacity-60" : ""}`}>{item.title}</div>
                        <div className="mt-1 text-xs text-[#757a8b]">{item.time}</div>
                      </div>
                      <button aria-label={`Delete ${item.title}`} onClick={() => void removeTask(item.id)} className="self-start rounded-lg p-1 text-[#9a9aaa] hover:bg-[#fff0ef] hover:text-[#a9322b]"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-[#777b89]">No tasks yet. Add one to plan your next study session.</p>}
                </div>

                <button onClick={() => setPlannerOpen(true)} className="mt-4 text-sm font-medium text-[#5c4eea]">{translate("View Full Schedule", language)}</button>
              </aside>

              <aside className="rounded-[26px] bg-[#f7f5f8] p-5 ring-1 ring-[#e9e7ec]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[0.95rem] font-semibold text-[#1d1d2a]">Achievements</div>
                  <button className="text-sm text-[#5c4eea]">View All</button>
                </div>
                <div className="rounded-[20px] bg-white p-4 ring-1 ring-[#eceaf3]">
                  <div className="mb-2 flex items-center gap-2 text-[#1d1d2a]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7d0d7] text-[#b25864]">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Top 10% Learner</div>
                      <div className="text-xs text-[#74798a]">Keep up the great work!</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {["1", "2", "3"].map((dot, index) => (
                      <div key={dot} className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-[#6854ea]" : "bg-[#d7daeb]"}`} />
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>}
          {isLifeToolsPage && (
            <div className="mx-auto w-full max-w-4xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[26px] bg-white p-6 ring-1 ring-[#e9e7ec]">
                <div>
                  <p className="text-sm font-medium text-[#6f5ae8]">{studentStandard} · {selectedSubjects.join(" · ")}</p>
                  <h1 className="mt-2 text-2xl font-bold text-[#242238]">{translate(activeSection, language)}</h1>
                </div>
                <button onClick={() => setActiveSection("Overview")} className="rounded-xl border border-[#e5e3ec] px-4 py-2 text-sm font-semibold text-[#5c4eea]">{translate("Overview", language)}</button>
              </div>

              {activeSection === "Daily Life Planner" && (
                <section className="rounded-[26px] bg-white p-6 ring-1 ring-[#e9e7ec]">
                  <CalendarDays className="h-7 w-7 text-[#6f5ae8]" />
                  <h2 className="mt-3 text-lg font-semibold text-[#242238]">{translate("Study planner", language)}</h2>
                  <p className="mt-2 text-sm text-[#777b89]">{translate("Plan school, study, rest, and personal time in one place.", language)}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={() => setPlannerOpen(true)} className="rounded-xl border border-[#e5e3ec] px-4 py-3 text-sm font-semibold text-[#5c4eea]">{translate("Add a study task", language)}</button>
                    <button onClick={() => askForGuidance("daily-plan")} disabled={!aiConfigured || chatBusy} className="rounded-xl bg-[#6f5ae8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{translate("Build my daily plan", language)}</button>
                  </div>
                  <h3 className="mt-7 font-semibold text-[#242238]">{translate("Today's Plan", language)}</h3>
                  <div className="mt-3 space-y-2">
                    {tasks.map((task) => <div key={task.id} className="flex items-center gap-3 rounded-2xl bg-[#f7f5f8] p-4">
                      <button aria-label={`Mark ${task.title} ${task.done ? "incomplete" : "complete"}`} onClick={() => void toggleTask(task)} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${task.done ? "bg-[#6f5ae8] text-white" : "border border-[#c8c9d2] bg-white"}`}>{task.done && <CheckCheck className="h-3 w-3" />}</button>
                      <div className="min-w-0 flex-1"><p className={task.done ? "truncate text-sm text-[#777b89] line-through" : "truncate text-sm font-medium text-[#343442]"}>{task.title}</p><p className="mt-1 text-xs text-[#858597]">{task.time}</p></div>
                      <button aria-label={`Delete ${task.title}`} onClick={() => void removeTask(task.id)} className="rounded-lg p-2 text-[#9a9aaa] hover:bg-[#fff0ef] hover:text-[#a9322b]"><Trash2 className="h-4 w-4" /></button>
                    </div>)}
                    {tasks.length === 0 && <p className="rounded-2xl bg-[#f7f5f8] p-4 text-sm text-[#777b89]">{translate("No tasks yet. Add one to build your routine.", language)}</p>}
                  </div>
                </section>
              )}

              {activeSection === "Money Manager" && (
                <section className="rounded-[26px] bg-white p-6 ring-1 ring-[#e9e7ec]">
                  <PiggyBank className="h-7 w-7 text-[#2d8d61]" />
                  <h2 className="mt-3 text-lg font-semibold text-[#242238]">{translate("Money skills for everyday life", language)}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#777b89]">{translate("Track money coming in, spending, and savings. The remaining amount is calculated here; nothing is sent to the AI tutor.", language)}</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {([
                      ["allowance", "Allowance / pocket money"],
                      ["spent", "Spent"],
                      ["saved", "Saved"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="text-sm font-medium text-[#454458]">{translate(label, language)}
                        <input type="number" min="0" step="0.01" inputMode="decimal" value={moneyAmounts[key]} onChange={(event) => setMoneyAmounts((current) => ({ ...current, [key]: event.target.value }))} aria-label={translate(label, language)} placeholder={translate("Amount", language)} className="mt-2 w-full rounded-xl border border-[#e5e3ec] bg-[#fcfbfd] px-4 py-3 text-sm outline-none focus:border-[#a99bec]" />
                      </label>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f2faf5] p-4">
                    <span className="font-medium text-[#456654]">{translate("Left to plan", language)}</span>
                    <span className="text-xl font-bold text-[#2d8d61]">{(Number(moneyAmounts.allowance || 0) - Number(moneyAmounts.spent || 0) - Number(moneyAmounts.saved || 0)).toFixed(2)}</span>
                    <button onClick={() => setMoneyAmounts({ allowance: "", spent: "", saved: "" })} className="text-sm font-medium text-[#5c4eea]">{translate("Reset amounts", language)}</button>
                  </div>
                  <p className="mt-3 text-xs text-[#858597]">{translate("Your money stays private on this device.", language)}</p>
                  <div className="mt-6 rounded-2xl bg-[#f7f5f8] p-5">
                    <h3 className="font-semibold text-[#343442]">{translate("Everyday money basics", language)}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#777b89]">{translate("Get age-appropriate tips for needs, wants, and saving goals.", language)}</p>
                    <button onClick={() => askForGuidance("money")} disabled={!aiConfigured || chatBusy} className="mt-4 rounded-xl bg-[#2d8d61] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{translate("Review money basics", language)}</button>
                  </div>
                </section>
              )}

              {activeSection === "Career & Job Guide" && (
                <section className="rounded-[26px] bg-white p-6 ring-1 ring-[#e9e7ec]">
                  <BriefcaseBusiness className="h-7 w-7 text-[#c88210]" />
                  <h2 className="mt-3 text-lg font-semibold text-[#242238]">{translate("Explore careers connected to your subjects", language)}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#777b89]">{translate("Explore realistic paths, skills to try, and small next steps. Your class and subjects help tailor suggestions.", language)}</p>
                  <div className="mt-5 flex flex-wrap gap-2">{selectedSubjects.map((subject) => <span key={subject} className="rounded-full bg-[#f1edff] px-3 py-2 text-sm font-medium text-[#5845cb]">{translate(subject, language)}</span>)}</div>
                  <div className="mt-6 rounded-2xl bg-[#fff9ed] p-5 text-sm leading-6 text-[#775b2c]">{translate("Career suggestions are for exploration and learning; they cannot guarantee a job, salary, or outcome.", language)}</div>
                  <button onClick={() => askForGuidance("career")} disabled={!aiConfigured || chatBusy} className="mt-5 rounded-xl bg-[#c88210] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{translate("Get career ideas", language)}</button>
                </section>
              )}
            </div>
          )}
        </main>
      </div>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 bg-[#171629]/35 lg:hidden" onClick={() => setMobileNavOpen(false)}>
          <nav aria-label="Mobile navigation" className="h-full w-[min(84vw,300px)] rounded-r-[28px] bg-[#f5f2f9] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-7 flex items-center justify-between">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7b65ee] to-[#8a87ff] text-white"><Sparkles className="h-4 w-4" /></span><span className="text-lg font-bold text-[#1e1e2b]">ThriveMate</span></div>
              <button aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} className="rounded-full p-2 text-[#5c6071] hover:bg-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-1.5">{sidebarItems.map(({ label, icon: Icon, badge }) => <button key={label} onClick={() => navigateToSection(label)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm ${activeSection === label ? "bg-white text-[#2d2d39] shadow-sm" : "text-[#3d3d49] hover:bg-white/50"}`}><Icon className="h-4 w-4 text-[#6c6c77]" /><span className="flex-1">{translate(label, language)}</span>{badge && <span className="rounded-full bg-[#1f2030] px-2 py-0.5 text-xs text-white">{badge}</span>}</button>)}</div>
            <div className="mt-7 rounded-2xl bg-[#f4eaf5] p-4"><p className="font-semibold text-[#1e1e2b]">Your study goal</p><p className="mt-1 text-sm text-[#5a5b65]">{studyGoal}</p></div>
          </nav>
        </div>
      )}
      {(plannerOpen || tutorOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171629]/40 p-4 backdrop-blur-sm" onClick={() => { setPlannerOpen(false); setTutorOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-label={tutorOpen ? "AI study tutor" : "Study planner"} className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-[#f7f5f8] shadow-2xl ring-1 ring-white/70" onClick={(event) => event.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-[#e9e7ec] px-6 py-4">
              <div>
                <h2 className="font-semibold text-[#1d1d2a]">{translate(tutorOpen ? "AI Study Tutor" : "Your Study Planner", language)}</h2>
                <p className="text-xs text-[#777b89]">{tutorOpen ? (aiConfigured ? `Powered by Google Gemini · ${aiModel}` : "Gemini connection needs setup") : "Tasks sync to your account"}</p>
              </div>
              <button aria-label="Close" onClick={() => { setPlannerOpen(false); setTutorOpen(false); }} className="rounded-full p-2 text-[#5c6071] hover:bg-white"><X className="h-5 w-5" /></button>
            </header>
            {tutorOpen ? (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {messages.map((message) => (
                    <div key={message.id} className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${message.role === "user" ? "ml-auto bg-[#6f5ae8] text-white" : "bg-white text-[#343442] ring-1 ring-[#eceaf3]"}`}>{message.text}</div>
                  ))}
                  {chatBusy && <div role="status" className="w-fit rounded-2xl bg-white px-4 py-3 text-sm text-[#68677b] ring-1 ring-[#eceaf3]">Gemini is thinking…</div>}
                  {chatError && <div role="alert" className="rounded-2xl bg-[#fff0ef] p-3 text-sm text-[#a9322b]">{chatError}{failedQuestion && <button onClick={() => void sendMessage(failedQuestion)} disabled={chatBusy || chatCooldownSeconds > 0} className="ml-2 font-semibold underline">{chatCooldownSeconds > 0 ? `Retry in ${chatCooldownSeconds}s` : "Retry"}</button>}</div>}
                  {messages.length === 1 && (
                    <div className="flex flex-wrap gap-2">
                      {["Explain React hooks", "Help me study algorithms", "Make a quick quiz"].map((prompt) => (
                        <button key={prompt} disabled={!aiConfigured || chatBusy} onClick={() => void sendMessage(prompt)} className="rounded-full bg-[#ede8ff] px-3 py-2 text-xs font-medium text-[#5849d5] hover:bg-[#e3dcff] disabled:opacity-50">{prompt}</button>
                      ))}
                    </div>
                  )}
                </div>
                {!aiConfigured && <div role="alert" className="mx-4 rounded-xl bg-[#fff4dd] p-3 text-sm text-[#8a5c0a]">Add your Google AI Studio key as GEMINI_API_KEY in the project .env file, then restart <code>npm run dev</code>.</div>}
                <form onSubmit={(event) => { event.preventDefault(); void sendMessage(chatDraft); }} className="flex gap-2 border-t border-[#e9e7ec] p-4">
                  <input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} disabled={chatBusy || !aiConfigured} placeholder="Ask your study question..." className="min-w-0 flex-1 rounded-full border border-[#e6e8ee] bg-white px-4 py-3 text-sm outline-none focus:border-[#a79bed] disabled:opacity-60" />
                  <button disabled={chatBusy || chatCooldownSeconds > 0 || !chatDraft.trim() || !aiConfigured} className="rounded-full bg-[#6f5ae8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5944d1] disabled:cursor-not-allowed disabled:opacity-50">{chatBusy ? "…" : chatCooldownSeconds > 0 ? `${chatCooldownSeconds}s` : "Send"}</button>
                </form>
              </>
            ) : (
              <>
                <div className="space-y-3 overflow-y-auto p-5">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 rounded-2xl bg-white p-4 ring-1 ring-[#eceaf3]">
                      <button onClick={() => void toggleTask(task)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md ${task.done ? "bg-[#6f5ae8] text-white" : "border border-[#c8c9d2]"}`}>{task.done && <CheckCheck className="h-3 w-3" />}</span>
                        <span className="flex-1"><span className={`block text-sm font-medium ${task.done ? "line-through opacity-60" : ""}`}>{task.title}</span><span className="mt-1 block text-xs text-[#757a8b]">{task.dueDate ? new Date(`${task.dueDate}T12:00:00`).toLocaleDateString(language === "Hindi" ? "hi-IN" : "en", { month: "short", day: "numeric", year: "numeric" }) : task.time}</span>{task.reason && <span className="mt-1 block text-xs text-[#777b89]">{task.reason}</span>}</span>
                      </button>
                      <button aria-label={`Delete ${task.title}`} onClick={() => void removeTask(task.id)} className="rounded-lg p-2 text-[#9a9aaa] hover:bg-[#fff0ef] hover:text-[#a9322b]"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-[#777b89]">No tasks yet. Add a study task below.</p>}
                </div>
                {apiError && <div role="alert" className="mx-4 rounded-xl bg-[#fff0ef] p-3 text-sm text-[#a9322b]">{apiError}</div>}
                <form onSubmit={(event) => { event.preventDefault(); void addTask(taskDraft); }} className="space-y-2 border-t border-[#e9e7ec] p-4">
                  <input value={taskDraft} maxLength={160} onChange={(event) => setTaskDraft(event.target.value)} placeholder="Add a study task..." className="w-full rounded-xl border border-[#e6e8ee] bg-white px-4 py-3 text-sm outline-none focus:border-[#a79bed]" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs font-medium text-[#5c6071]">Date
                      <input type="date" required value={dueDateDraft} onChange={(event) => setDueDateDraft(event.target.value)} className="mt-1 w-full rounded-xl border border-[#e6e8ee] bg-white px-3 py-2 text-sm outline-none focus:border-[#a79bed]" />
                    </label>
                    <label className="text-xs font-medium text-[#5c6071]">Reason (optional)
                      <input value={reasonDraft} maxLength={240} onChange={(event) => setReasonDraft(event.target.value)} placeholder="e.g. Prepare for Friday's test" className="mt-1 w-full rounded-xl border border-[#e6e8ee] bg-white px-3 py-2 text-sm outline-none focus:border-[#a79bed]" />
                    </label>
                  </div>
                  <button disabled={taskBusy || !taskDraft.trim() || !dueDateDraft} className="w-full rounded-xl bg-[#6f5ae8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5944d1] disabled:opacity-50">{taskBusy ? "Saving…" : "Add task"}</button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
      {(settingsOpen || communityOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171629]/40 p-4 backdrop-blur-sm" onClick={() => { setSettingsOpen(false); setCommunityOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-label={settingsOpen ? "Profile settings" : "Study community"} className="w-full max-w-lg rounded-[28px] bg-[#f7f5f8] p-6 shadow-2xl ring-1 ring-white/70" onClick={(event) => event.stopPropagation()}>
            <header className="mb-5 flex items-center justify-between">
              <div><h2 className="font-semibold text-[#1d1d2a]">{translate(settingsOpen ? "Profile & study settings" : "Study community", language)}</h2><p className="mt-1 text-xs text-[#777b89]">{translate(settingsOpen ? "Your profile is saved to your account." : "Sample learner profiles from the community.", language)}</p></div>
              <button aria-label="Close" onClick={() => { setSettingsOpen(false); setCommunityOpen(false); }} className="rounded-full p-2 text-[#5c6071] hover:bg-white"><X className="h-5 w-5" /></button>
            </header>
            {settingsOpen ? (
              <div>
                <label className="text-sm font-medium text-[#454458]">Your name</label>
                <input value={studentName} maxLength={80} onChange={(event) => setStudentName(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#e5e3ec] bg-white px-4 py-3 text-sm outline-none focus:border-[#a99bec]" />
                <label htmlFor="profile-language" className="mt-4 block text-sm font-medium text-[#454458]">{translate("Language", language)}</label>
                <select id="profile-language" value={language} onChange={(event) => setLanguage(event.target.value as "English" | "Hindi")} className="mt-2 w-full rounded-2xl border border-[#e5e3ec] bg-white px-4 py-3 text-sm outline-none focus:border-[#a99bec]"><option value="English">English</option><option value="Hindi">हिन्दी</option></select>
                <label htmlFor="profile-standard" className="mt-4 block text-sm font-medium text-[#454458]">Class / standard</label>
                <select id="profile-standard" value={studentStandard} onChange={(event) => changeStandard(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#e5e3ec] bg-white px-4 py-3 text-sm outline-none focus:border-[#a99bec]">{Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`).map((grade) => <option key={grade} value={grade}>{grade}</option>)}<option value="Undergraduate">Undergraduate</option><option value="Postgraduate">Postgraduate</option><option value="Other">Other</option></select>
                <p className="mt-5 text-sm font-medium text-[#454458]">Study subjects for {studentStandard}</p>
                <div className="mt-2 flex flex-wrap gap-2">{availableSubjects.map((subject) => { const selected = selectedSubjects.includes(subject); return <button key={subject} onClick={() => setSelectedSubjects((current) => selected ? current.filter((item) => item !== subject) : [...current, subject])} className={`rounded-full border px-3 py-2 text-xs ${selected ? "border-[#8e7be9] bg-[#f1edff] font-semibold text-[#5845cb]" : "border-[#e8e6ed] bg-white text-[#666679]"}`}>{selected ? "✓ " : ""}{translate(subject, language)}</button>; })}</div>
                <p className="mt-5 text-sm font-medium text-[#454458]">Daily study goal</p>
                <div className="mt-2 flex flex-wrap gap-2">{["30 min a day", "1 hour a day", "2 hours a day"].map((goal) => <button key={goal} onClick={() => setStudyGoal(goal)} className={`rounded-full border px-3 py-2 text-xs ${studyGoal === goal ? "border-[#8e7be9] bg-[#f1edff] font-semibold text-[#5845cb]" : "border-[#e8e6ed] bg-white text-[#666679]"}`}>{goal}</button>)}</div>
                {apiError && <p role="alert" className="mt-4 rounded-xl bg-[#fff0ef] p-3 text-sm text-[#a9322b]">{apiError}</p>}
                <button disabled={profileBusy || !studentName.trim() || selectedSubjects.length === 0} onClick={() => void saveProfile()} className="mt-6 w-full rounded-2xl bg-[#6f5ae8] px-4 py-3 font-semibold text-white hover:bg-[#5944d1] disabled:opacity-50">{profileBusy ? "Saving…" : "Save settings"}</button>
                <button onClick={() => void signOut()} className="mt-3 w-full rounded-2xl border border-[#e5e3ec] bg-white px-4 py-3 text-sm font-medium text-[#5c6071] hover:bg-[#faf9fc]">Sign out</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-[#eceaf3]"><div className="font-semibold text-[#29283b]">Study circle</div><p className="mt-1 text-sm text-[#777b89]">Share study goals, compare notes, and celebrate progress with other learners.</p></div>
                {["Maya · Reviewing JavaScript", "Noah · Practicing algebra", "Ava · Working on UI design"].map((learner) => <div key={learner} className="rounded-2xl bg-white px-4 py-3 text-sm text-[#555569] ring-1 ring-[#eceaf3]">{learner}</div>)}
                <button onClick={() => { setCommunityOpen(false); setTutorOpen(true); }} className="mt-2 w-full rounded-2xl bg-[#6f5ae8] px-4 py-3 font-semibold text-white hover:bg-[#5944d1]">Ask the study tutor</button>
              </div>
            )}
          </section>
        </div>
      )}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171629]/40 p-4 backdrop-blur-sm" onClick={() => setNotificationsOpen(false)}>
          <section role="dialog" aria-modal="true" aria-label="Notifications" className="w-full max-w-md rounded-[28px] bg-[#f7f5f8] p-6 shadow-2xl ring-1 ring-white/70" onClick={(event) => event.stopPropagation()}>
            <header className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold text-[#1d1d2a]">Notifications</h2><p className="mt-1 text-xs text-[#777b89]">Your study updates</p></div><button aria-label="Close notifications" onClick={() => setNotificationsOpen(false)} className="rounded-full p-2 text-[#5c6071] hover:bg-white"><X className="h-5 w-5" /></button></header>
            {!aiConfigured && <div className="mb-3 rounded-2xl bg-[#fff4dd] p-4 text-sm text-[#8a5c0a]">Connect Gemini by adding GEMINI_API_KEY to .env, then restart the app.</div>}
            {tasks.filter((task) => !task.done).map((task) => <div key={task.id} className="mb-2 flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#eceaf3]"><CalendarDays className="h-4 w-4 text-[#7059e8]" /><span className="flex-1 text-sm text-[#454458]">{task.title}</span><button onClick={() => { setNotificationsOpen(false); setPlannerOpen(true); }} className="text-xs font-semibold text-[#5c4eea]">Open plan</button></div>)}
            {tasks.every((task) => task.done) && aiConfigured && <p className="rounded-2xl bg-white p-4 text-sm text-[#666679]">You’re all caught up. Nice work!</p>}
          </section>
        </div>
      )}
      {screen === "dashboard" && breakSecondsLeft > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#171629] p-4 text-white" role="dialog" aria-modal="true" aria-label={translate("Break time", language)}>
          <section className="w-full max-w-xl rounded-[32px] bg-white p-7 text-center text-[#242238] shadow-2xl sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1edff] text-[#6f5ae8]"><Dumbbell className="h-8 w-8" /></div>
            <h1 className="mt-5 text-3xl font-bold">{translate("Break time", language)}</h1>
            <p className="mt-3 rounded-2xl bg-[#f1edff] px-4 py-3 font-semibold text-[#5845cb]">{translate("You’ve studied for an hour. Take a five-minute break.", language)}</p>
            <p className="mt-2 text-[#777789]">{translate("Your study screen is paused", language)}</p>
            <p className="mt-1 text-sm text-[#777789]">{translate("A five-minute reset helps you return refreshed.", language)}</p>
            <div className="my-7 font-mono text-6xl font-bold tabular-nums text-[#6f5ae8]" aria-live="polite">
              {Math.floor(breakSecondsLeft / 60)}:{String(breakSecondsLeft % 60).padStart(2, "0")}
            </div>
            <p className="font-semibold text-[#343442]">{translate("Move gently, only in a way that feels comfortable.", language)}</p>
            <div className="mt-4 rounded-2xl bg-[#f7f5f8] p-5 text-left text-[#555569]">
              <ul className="list-disc space-y-2 pl-5">
                {physicalBreakSuggestions.map((suggestion) => <li key={suggestion}>{translate(suggestion, language)}</li>)}
              </ul>
            </div>
            <p className="mt-5 text-sm text-[#777789]">{translate("Break ends in", language)} {Math.floor(breakSecondsLeft / 60)}:{String(breakSecondsLeft % 60).padStart(2, "0")}</p>
          </section>
        </div>
      )}
    </div>
  );
}
