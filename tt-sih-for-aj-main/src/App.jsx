import { useState, useEffect, useRef } from "react";
import {
  getFirestore, collection, doc, setDoc, onSnapshot, getDoc
} from "firebase/firestore";
import {
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import SignInPage from './components/SignInPage.jsx';
import Dashboard from './components/Dashboard.jsx';

// Define the types within the file for a single-file React app.
/**
 * @typedef {Object} Subject
 * @property {string} name
 * @property {string[]} teachers
 * @property {number} credits
 */
/**
 * @typedef {Object} ClassDef
 * @property {string} name
 * @property {Subject[]} subjects
 * @property {string[]} students
 */
/**
 * @typedef {Object} Teacher
 * @property {string} id
 * @property {string} name
 * @property {number} weeklyRequiredHours
 * @property {number} hoursLeft
 * @property {number} skipsUsed
 * @property {string} [expertise]
 */
/**
 * @typedef {string[][]} Timetable
 */
/**
 * @typedef {Object} TimetableSlot
 * @property {string} subjectName
 * @property {string} className
 * @property {string} status // 'confirmed', 'declined', 'sub_request', 'free', 'break'
 * @property {string} teacherId // The original teacher for the slot
 */

const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : null);
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Helper to safely parse timetable data that may be stored as a JSON string or as an object/array already.
function parseTimetableData(raw) {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse timetable JSON, returning empty timetable instead.', e);
      return [];
    }
  }
  if (Array.isArray(raw)) return raw;
  // If it's an object that resembles a timetable mapping, attempt to return as-is
  return Array.isArray(raw) ? raw : [];
}

// Add the Tailwind CSS script for styling
const tailwindScript = document.createElement('script');
tailwindScript.src = "https://cdn.tailwindcss.com";
document.head.appendChild(tailwindScript);

export default function App() {
  const [collegeId, setCollegeId] = useState("");
  const [role, setRole] = useState(null);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Admin timetable settings (UI controls) and persisted settings
  const [workingDays, setWorkingDays] = useState(5);
  const [hoursPerDay, setHoursPerDay] = useState(5);
  const [breakSlots, setBreakSlots] = useState([]); // zero-based indices preferred
  const [classStartTime, setClassStartTime] = useState("09:00");
  const [classDuration, setClassDuration] = useState(60);
  const [freePeriodPercentage, setFreePeriodPercentage] = useState(20);
  const [timetableSettings, setTimetableSettings] = useState(null);

  const [generatedTimetables, setGeneratedTimetables] = useState({});

  // Subject management state
  const [selectedClass, setSelectedClass] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCredits, setNewSubjectCredits] = useState(1);
  const [newSubjectTeachers, setNewSubjectTeachers] = useState([]);

  // Auth and Firestore state
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Libraries and uploads
  const [isLibrariesLoaded, setIsLibrariesLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Teacher and student state
  const [teacherTimetable, setTeacherTimetable] = useState([]);
  const [studentClass, setStudentClass] = useState(null);

  // UI state
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [currentView, setCurrentView] = useState('dashboard');

  // Guards
  const isGeneratingRef = useRef(false);

  // Load external library scripts and handle auth
  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
      });
    };

    Promise.all([
      loadScript("https://unpkg.com/xlsx/dist/xlsx.full.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
      loadScript("https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js")
    ])
    .then(() => setIsLibrariesLoaded(true))
    .catch(err => {
      console.error("Failed to load libraries:", err);
      showMessage("Failed to load external libraries. Please try refreshing the page.", "error");
    });

    if (!auth) return;

    const authenticate = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase auth error:", error);
        showMessage("Failed to authenticate. Please try again.", "error");
      }
    };
    authenticate();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [auth]);

  // Listeners for classes, teachers, timetables + settings
  useEffect(() => {
    if (isAuthReady && userId && db) {
      const classesCol = collection(db, "artifacts", appId, "public", "data", "classes");
      const unsubscribeClasses = onSnapshot(classesCol, (snapshot) => {
        const classList = snapshot.docs.map((d) => d.data());
        setClasses(classList);
      });

      const teachersCol = collection(db, "artifacts", appId, "public", "data", "teachers");
      const unsubscribeTeachers = onSnapshot(teachersCol, (snapshot) => {
        const teacherList = snapshot.docs.map((d) => d.data());
        setTeachers(teacherList);
      });

      const timetablesCol = collection(db, "artifacts", appId, "public", "data", "timetables");
      const unsubscribeTimetables = onSnapshot(timetablesCol, (snapshot) => {
        const timetableMap = {};
        let settings = null;
        snapshot.docs.forEach((d) => {
          if (d.id === 'settings') {
            settings = d.data();
          } else {
            timetableMap[d.id] = parseTimetableData(d.data().timetable);
          }
        });

        if (settings) {
          setTimetableSettings(settings);
          setWorkingDays(settings.workingDays ?? 5);
          setHoursPerDay(settings.hoursPerDay ?? 5);
          setBreakSlots(Array.isArray(settings.breakSlots) ? settings.breakSlots : []);
          setClassStartTime(settings.classStartTime ?? "09:00");
          setClassDuration(settings.classDuration ?? 60);
          setFreePeriodPercentage(settings.freePeriodPercentage ?? 20);
        }
        setGeneratedTimetables(timetableMap);
      });

      return () => {
        unsubscribeClasses();
        unsubscribeTeachers();
        unsubscribeTimetables();
      };
    }
  }, [isAuthReady, userId, db]);

  // Build teacher timetable using current settings
  useEffect(() => {
    if (role === 'teacher' && collegeId && (timetableSettings || (workingDays && hoursPerDay))) {
      const teacherId = collegeId;
      const days = workingDays;
      const hours = hoursPerDay;
      const breaks = breakSlots || [];

      const base = Array.from({ length: days }, () => Array.from({ length: hours }, () => null));

      // Mark breaks
      for (let d = 0; d < days; d++) {
        breaks.forEach((p) => {
          if (p >= 0 && p < hours) {
            base[d][p] = { subjectName: 'Break', className: '', status: 'break', teacherId: '' };
          }
        });
      }

      // Fill assigned slots
      Object.keys(generatedTimetables).forEach((className) => {
        const table = generatedTimetables[className];
        if (!Array.isArray(table)) return;
        table.forEach((daySlots, dayIdx) => {
          daySlots.forEach((slot, periodIdx) => {
            if (slot && slot.teacherId === teacherId) {
              base[dayIdx][periodIdx] = {
                subjectName: slot.subjectName,
                className,
                status: slot.status,
                teacherId: slot.teacherId,
              };
            }
          });
        });
      });

      // Fill remaining as Free
      for (let d = 0; d < days; d++) {
        for (let p = 0; p < hours; p++) {
          if (!base[d][p]) base[d][p] = { subjectName: 'Free', className: '', status: 'free', teacherId: '' };
        }
      }
      setTeacherTimetable(base);
    }
  }, [generatedTimetables, collegeId, role, timetableSettings, workingDays, hoursPerDay, breakSlots]);

  const handleLogin = (inputId, inputRole) => {
    const id = inputId || collegeId;
    if (!id) return;
    setCollegeId(id);

    let r = inputRole;
    if (!r) {
      if (id.startsWith('S-')) r = 'student';
      else if (id.startsWith('T-')) r = 'teacher';
      else if (id.startsWith('A-')) r = 'admin';
      else r = 'admin';
    }
    setRole(r);

    if (r === 'student') {
      const cls = classes.find(c => Array.isArray(c.students) && c.students.includes(id));
      if (cls) setStudentClass(cls.name);
    }

    setCurrentView('dashboard');
  };

  const backToLogin = () => {
    setRole(null);
    setCollegeId("");
    setStudentClass(null);
    setCurrentView('dashboard');
  };

  const handleNavigation = (view) => setCurrentView(view);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleTeacherCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) { showMessage("No file selected.", "error"); return; }
    if (!db) { showMessage("Database not ready. Please try again.", "error"); return; }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error("File data is empty.");
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        const newTeachers = json.map((row) => {
          if (!row.ID || !row.Name || !row.WorkingHours) {
            throw new Error(`Missing required fields (ID, Name, WorkingHours) in row: ${JSON.stringify(row)}`);
          }
          return {
            id: String(row.ID),
            name: String(row.Name),
            weeklyRequiredHours: Number(row.WorkingHours),
            hoursLeft: Number(row.WorkingHours),
            skipsUsed: 0,
            expertise: row.Expertise ? String(row.Expertise) : "",
          };
        });

        const teachersPublicRef = collection(db, "artifacts", appId, "public", "data", "teachers");
        const uploadPromises = newTeachers.map((teacher) => {
          const teacherDocRef = doc(teachersPublicRef, teacher.id);
          return setDoc(teacherDocRef, teacher);
        });
        await Promise.all(uploadPromises);

        setTeachers(newTeachers);
        showMessage("Teachers uploaded successfully!", "success");
      } catch (error) {
        console.error("Error uploading teachers:", error);
        showMessage(`Failed to upload teachers. Check the console for details: ${error.message}`, "error");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleStudentCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!db) { showMessage("Database not ready. Please try again.", "error"); return; }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error("File data is empty.");
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        const classesMap = {};
        json.forEach((row) => {
          const className = String(row.ClassName);
          if (!classesMap[className]) {
            classesMap[className] = { name: className, subjects: [], students: [] };
          }
          classesMap[className].students.push(String(row.StudentID));
        });

        const classesPublicRef = collection(db, "artifacts", appId, "public", "data", "classes");
        const uploadPromises = Object.keys(classesMap).map(clsName => {
          const classDocRef = doc(classesPublicRef, clsName);
          return setDoc(classDocRef, classesMap[clsName], { merge: true });
        });
        await Promise.all(uploadPromises);
        showMessage("Students uploaded successfully!", "success");
      } catch (error) {
        console.error("Error uploading students:", error);
        showMessage(`Failed to upload students. Check the console for details: ${error.message}`, "error");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubjectAdd = async () => {
    if (!selectedClass || !newSubjectName || newSubjectCredits <= 0 || newSubjectTeachers.length === 0) {
      showMessage("Please fill all subject fields correctly.", "error");
      return;
    }
    if (!db) { showMessage("Database not ready. Please try again.", "error"); return; }

    const classToUpdate = classes.find(cls => cls.name === selectedClass);
    if (!classToUpdate) { showMessage("Selected class not found.", "error"); return; }

    const updatedSubjects = [...(classToUpdate.subjects || []), {
      name: newSubjectName,
      credits: Number(newSubjectCredits),
      teachers: newSubjectTeachers
    }];

    const classRef = doc(db, "artifacts", appId, "public", "data", "classes", selectedClass);
    await setDoc(classRef, { subjects: updatedSubjects }, { merge: true });
    showMessage("Subject added successfully!", "success");
    setNewSubjectName("");
    setNewSubjectCredits(1);
    setNewSubjectTeachers([]);
  };

  const generateTimetable = async () => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    if (classes.length === 0 || teachers.length === 0) {
      showMessage("Please upload teacher and student data first.", "error");
      isGeneratingRef.current = false;
      return;
    }
    if (!db) { showMessage("Database not ready. Please try again.", "error"); isGeneratingRef.current = false; return; }

    const classesWithoutSubjects = classes.filter(cls => !cls.subjects || cls.subjects.length === 0);
    if (classesWithoutSubjects.length > 0) {
      const classNames = classesWithoutSubjects.map(c => c.name).join(", ");
      showMessage(`Classes ${classNames} have no subjects assigned. Please assign subjects before generating the timetable.`, "error");
      isGeneratingRef.current = false;
      return;
    }

    const currentWorkingDays = workingDays;
    const currentHoursPerDay = hoursPerDay;
    const currentBreakSlots = breakSlots || [];
    const currentFreePercent = freePeriodPercentage;
    const totalSlotsPerWeek = currentWorkingDays * currentHoursPerDay;

    const teacherHoursLeft = {};
    teachers.forEach(t => { teacherHoursLeft[t.id] = t.weeklyRequiredHours; });

    const newTimetables = {};

    for (const cls of classes) {
      const table = Array.from({ length: currentWorkingDays }, () => Array.from({ length: currentHoursPerDay }, () => null));

      // Pre-fill break slots
      for (let day = 0; day < currentWorkingDays; day++) {
        currentBreakSlots.forEach((period) => {
          if (period >= 0 && period < currentHoursPerDay) {
            table[day][period] = { subjectName: 'Break', className: '', status: 'break', teacherId: '' };
          }
        });
      }

      // Create subject period pool based on credits
      const totalCredits = cls.subjects.reduce((sum, s) => sum + Number(s.credits || 0), 0);
      const subjectSlotsTarget = Math.round(totalSlotsPerWeek * (1 - currentBreakSlots.length / currentHoursPerDay / currentWorkingDays) * (1 - currentFreePercent / 100));
      const pool = [];
      cls.subjects.forEach((s) => {
        const count = totalCredits > 0 ? Math.round((Number(s.credits || 0) / totalCredits) * subjectSlotsTarget) : 0;
        for (let i = 0; i < count; i++) pool.push({ subjectName: s.name, teachers: s.teachers });
      });

      // Fill remaining with Free
      while (pool.length < (currentWorkingDays * currentHoursPerDay - currentBreakSlots.length)) {
        pool.push({ subjectName: 'Free', teachers: [] });
      }

      // Shuffle
      pool.sort(() => Math.random() - 0.5);

      for (let day = 0; day < currentWorkingDays; day++) {
        for (let period = 0; period < currentHoursPerDay; period++) {
          if (table[day][period]) continue; // break already set

          let placed = false;
          for (let i = 0; i < pool.length; i++) {
            const cand = pool[i];

            // Limit same subject to at most 2 per day
            if (cand.subjectName !== 'Free') {
              const countToday = table[day].filter(s => s && s.subjectName === cand.subjectName).length;
              if (countToday >= 2) continue;
            }

            let teacherId = '';
            if (cand.subjectName !== 'Free') {
              const avail = cand.teachers.find(tid => (teacherHoursLeft[tid] || 0) > 0 &&
                !Object.values(newTimetables).some(tt => tt?.[day]?.[period]?.teacherId === tid));
              if (!avail) continue;
              teacherId = avail;
            }

            table[day][period] = {
              subjectName: cand.subjectName,
              className: cls.name,
              status: cand.subjectName === 'Free' ? 'free' : 'confirmed',
              teacherId
            };

            if (teacherId) teacherHoursLeft[teacherId] = (teacherHoursLeft[teacherId] || 0) - 1;
            pool.splice(i, 1);
            placed = true;
            break;
          }

          if (!placed) {
            table[day][period] = { subjectName: 'Free', className: '', status: 'free', teacherId: '' };
          }
        }
      }

      newTimetables[cls.name] = table;
    }

    try {
      const settingsRef = doc(db, "artifacts", appId, "public", "data", "timetables", "settings");
      await setDoc(settingsRef, {
        workingDays, hoursPerDay, breakSlots, classStartTime, classDuration, freePeriodPercentage
      }, { merge: true });

      for (const clsName in newTimetables) {
        const timetableRef = doc(db, "artifacts", appId, "public", "data", "timetables", clsName);
        await setDoc(timetableRef, { timetable: JSON.stringify(newTimetables[clsName]) });
      }

      for (const t of teachers) {
        const teacherRef = doc(db, "artifacts", appId, "public", "data", "teachers", t.id);
        await setDoc(teacherRef, { hoursLeft: teacherHoursLeft[t.id] }, { merge: true });
      }

      showMessage("Timetable generated and saved successfully!", "success");
    } catch (error) {
      console.error("Error generating/saving timetable:", error);
      showMessage("Failed to generate and save timetable. Check console for details.", "error");
    } finally {
      isGeneratingRef.current = false;
    }
  };

  const handleSlotToggle = async (dayIndex, periodIndex, slot) => {
    if (!db) { showMessage("Database not ready. Please try again.", "error"); return; }
    const className = slot.className;
    const subjectName = slot.subjectName;
    const currentTeacherId = collegeId;

    if (slot.status === 'confirmed') {
      const classDocRef = doc(db, "artifacts", appId, "public", "data", "classes", className);
      const classDoc = await getDoc(classDocRef);
      if (!classDoc.exists()) return;
      const subjectData = (classDoc.data().subjects || []).find(s => s.name === subjectName);
      if (!subjectData) return;

      const otherTeachers = (subjectData.teachers || []).filter(tid => tid !== currentTeacherId);
      let replacementFound = false;
      for (const otherTeacherId of otherTeachers) {
        const timetableRef = doc(db, "artifacts", appId, "public", "data", "timetables", className);
        const timetableDoc = await getDoc(timetableRef);
        if (timetableDoc.exists()) {
          const classTimetable = parseTimetableData(timetableDoc.data().timetable);
          const isFree = classTimetable?.[dayIndex]?.[periodIndex]?.subjectName === 'Free';
          if (isFree) {
            const updatedTimetable = classTimetable.map(day => [...day]);
            updatedTimetable[dayIndex][periodIndex] = {
              subjectName,
              className,
              status: 'sub_request',
              teacherId: otherTeacherId,
            };
            await setDoc(timetableRef, { timetable: JSON.stringify(updatedTimetable) });
            showMessage(`Substitution request sent to Teacher ${otherTeacherId}!`, "info");
            replacementFound = true;
            break;
          }
        }
      }

      if (!replacementFound) {
        const timetableRef = doc(db, "artifacts", appId, "public", "data", "timetables", className);
        const classTimetableDoc = await getDoc(timetableRef);
        const classTimetable = parseTimetableData(classTimetableDoc.data().timetable);
        const updatedTimetable = classTimetable.map(day => [...day]);
        updatedTimetable[dayIndex][periodIndex] = { subjectName: 'Free', className: '', status: 'free', teacherId: '' };
        await setDoc(timetableRef, { timetable: JSON.stringify(updatedTimetable) });
        showMessage("No substitute available. Slot converted to a Free Period.", "info");
      }
    } else if (slot.status === 'sub_request') {
      const timetableRef = doc(db, "artifacts", appId, "public", "data", "timetables", className);
      const classTimetableDoc = await getDoc(timetableRef);
      const classTimetable = parseTimetableData(classTimetableDoc.data().timetable);
      const updatedTimetable = classTimetable.map(day => [...day]);
      updatedTimetable[dayIndex][periodIndex] = { ...updatedTimetable[dayIndex][periodIndex], status: 'confirmed' };
      await setDoc(timetableRef, { timetable: JSON.stringify(updatedTimetable) });
      showMessage("Class accepted! Your timetable has been updated.", "success");
    }
  };

  const calculateTimeSlots = () => {
    const settings = timetableSettings || { hoursPerDay, classStartTime, classDuration, breakSlots };
    const { hoursPerDay: hpd, classStartTime: cst, classDuration: dur, breakSlots: brks } = settings;
    if (!hpd || !cst || !dur) return [];
    const slots = [];
    let [startHour, startMinute] = cst.split(":").map(Number);
    const current = new Date();
    current.setHours(startHour, startMinute, 0, 0);
    for (let i = 0; i < hpd; i++) {
      const start = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if ((brks || []).includes(i)) {
        current.setMinutes(current.getMinutes() + 30);
        slots.push('Break');
      } else {
        current.setMinutes(current.getMinutes() + Number(dur));
        const end = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        slots.push(`${start} - ${end}`);
      }
    }
    return slots;
  };

  const downloadTimetable = (clsName, format) => {
    const table = generatedTimetables[clsName];
    if (!table || !isLibrariesLoaded) { showMessage("Timetable or libraries not available for download.", "error"); return; }

    const headerRow = ["Day/Period", ...(calculateTimeSlots().length ? calculateTimeSlots() : Array.from({ length: hoursPerDay }, (_, i) => `Period ${i + 1}`))];
    const safe = (cell) => (cell ? cell.subjectName : 'N/A');
    const bodyRows = table.map((row, dayIdx) => [`Day ${dayIdx + 1}`, ...row.map(safe)]);

    if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, clsName);
      XLSX.writeFile(wb, `${clsName}_timetable.xlsx`);
    } else if (format === 'pdf') {
      const { jsPDF } = window.jspdf || {};
      const doc = jsPDF ? new jsPDF() : null;
      if (!doc) { showMessage('PDF library not loaded.', 'error'); return; }
      doc.setFontSize(10);
      let y = 10;
      const data = [headerRow, ...bodyRows];
      data.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
          doc.text(String(cell), 10 + cIdx * 30, y + rIdx * 10);
        });
      });
      doc.save(`${clsName}_timetable.pdf`);
    } else if (format === 'txt') {
      const text = [headerRow, ...bodyRows].map(r => r.join('\t')).join('\n');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      window.saveAs(blob, `${clsName}_timetable.txt`);
    }
    showMessage(`Timetable downloaded as ${format.toUpperCase()}!`, 'success');
  };

  if (!isAuthReady || !isLibrariesLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-neutral-900 text-white font-sans p-5">
        <div className="text-xl font-semibold animate-pulse">Loading App...</div>
        <div className="text-sm mt-2">Connecting to Firebase and loading libraries...</div>
      </div>
    );
  }

  const allClassesHaveSubjects = classes.length > 0 && classes.every(cls => cls.subjects && cls.subjects.length > 0);
  const isGenerateEnabled = classes.length > 0 && teachers.length > 0 && allClassesHaveSubjects;
  const isSubjectManagementEnabled = teachers.length > 0;

  return (
    <div className="grid place-items-center min-h-screen w-full bg-neutral-900 text-white font-sans p-5">
      <div className="text-xs text-neutral-500 mb-4">User ID: {userId || 'Authenticating...'}</div>
      {message.text && (
        <div className={`fixed top-5 z-50 px-6 py-3 rounded-lg shadow-xl text-white transition-all duration-300 ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {message.text}
        </div>
      )}

      {!role && <SignInPage onLogin={handleLogin} />}

      {role === "admin" && (
        <div className="w-full max-w-4xl">
          <h1 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h1>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Time and Class Configuration</h2>
            <button
              className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
              onClick={backToLogin}
            >
              Logout
            </button>
          </div>

          {/* Data Status */}
          <div className="bg-neutral-800 p-6 rounded-2xl shadow-lg border border-neutral-700 mb-6">
            <h3 className="text-lg font-semibold mb-3">Data Status</h3>
            <p className="text-sm">Loaded Classes: {classes.length}</p>
            <p className="text-sm">Loaded Teachers: {teachers.length}</p>
            <p className="text-sm mt-2">
              All classes have subjects assigned: {" "}
              <span className={`font-bold ${allClassesHaveSubjects ? 'text-green-400' : 'text-red-400'}`}>
                {allClassesHaveSubjects ? 'Yes' : 'No'}
              </span>
            </p>
          </div>

          {/* Upload Data */}
          <div className="bg-neutral-800 p-6 rounded-2xl shadow-lg border border-neutral-700 mb-6">
            <h3 className="text-lg font-semibold mb-3">Upload Data</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Upload Teachers CSV</label>
              <input type="file" accept=".csv, .xlsx, .xls" onChange={handleTeacherCSV} className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Upload Students CSV</label>
              <input type="file" accept=".csv, .xlsx, .xls" onChange={handleStudentCSV} className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
            </div>
            {isUploading && (
              <p className="text-sm text-blue-400 mt-2 text-center">Uploading data, please wait...</p>
            )}
          </div>

          {/* Subject Management */}
          <div className={`bg-neutral-800 p-6 rounded-2xl shadow-lg border border-neutral-700 mb-6 transition-all duration-300 ${!isSubjectManagementEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="text-lg font-semibold mb-3">Subject Management</h3>
            {!isSubjectManagementEnabled && (
              <p className="text-center text-red-400 mb-4">Please upload teacher data first to manage subjects.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select Class</label>
                  <select
                    className="w-full p-2 rounded-lg bg-neutral-700 text-white border border-neutral-600"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="">-- Select a Class --</option>
                    {classes.map((cls) => (
                      <option key={cls.name} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject Name</label>
                  <input
                    type="text"
                    className="w-full p-2 rounded-lg bg-neutral-700 text-white border border-neutral-600 placeholder:text-neutral-400"
                    placeholder="e.g., Data Structures"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Credits</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-lg bg-neutral-700 text-white border border-neutral-600"
                    value={newSubjectCredits}
                    onChange={(e) => setNewSubjectCredits(Number(e.target.value))}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Assign Teachers</label>
                  <select
                    multiple
                    className="w-full p-2 rounded-lg bg-neutral-700 text-white border border-neutral-600"
                    value={newSubjectTeachers}
                    onChange={(e) => {
                      const selectedTeachers = Array.from(e.target.selectedOptions, option => option.value);
                      setNewSubjectTeachers(selectedTeachers);
                    }}
                  >
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-400 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                </div>
                <button
                  className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors mt-2"
                  onClick={handleSubjectAdd}
                >
                  Add Subject
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="font-semibold">Subjects per Class</h4>
                {classes.map(cls => (
                  <div key={cls.name} className="bg-neutral-700 p-4 rounded-lg">
                    <h5 className="font-medium text-neutral-200">{cls.name} ({cls.subjects?.length || 0} subjects)</h5>
                    <ul className="list-disc list-inside mt-2 text-sm text-neutral-400">
                      {cls.subjects?.map((sub, idx) => (
                        <li key={idx}>{sub.name} ({sub.credits} credits) assigned to {sub.teachers.join(', ')}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timetable Settings Section */}
          <div className="bg-neutral-800 p-6 rounded-2xl shadow-lg border border-neutral-700 mb-6">
            <h3 className="text-lg font-semibold mb-3">Timetable Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <label className="text-sm font-medium">Working Days:</label>
                <input type="number" value={workingDays} onChange={e => setWorkingDays(Number(e.target.value))} className="w-24 p-2 rounded-lg bg-neutral-700 text-white border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <label className="text-sm font-medium">Hours Per Day:</label>
                <input type="number" value={hoursPerDay} onChange={e => setHoursPerDay(Number(e.target.value))} className="w-24 p-2 rounded-lg bg-neutral-700 text-white border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="text-sm font-medium">Break Slots (comma-separated, 0-based):</label>
                <input type="text" value={(breakSlots || []).join(',')} onChange={e => setBreakSlots(e.target.value.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n)))} className="w-full sm:w-24 p-2 rounded-lg bg-neutral-700 text-white border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="text-sm font-medium">Class Start Time:</label>
                <input type="time" value={classStartTime} onChange={e => setClassStartTime(e.target.value)} className="w-24 p-2 rounded-lg bg-neutral-700 text-white border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="text-sm font-medium">Class Duration (min):</label>
                <input type="number" value={classDuration} onChange={e => setClassDuration(Number(e.target.value))} className="w-24 p-2 rounded-lg bg-neutral-700 text-white border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="text-sm font-medium">Free Period %:</label>
                <input type="number" value={freePeriodPercentage} onChange={e => setFreePeriodPercentage(Number(e.target.value))} className="w-24 p-2 rounded-lg bg-neutral-700 text-white border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" max="100" />
              </div>
            </div>
          </div>

          <button
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${isGenerateEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-neutral-600 cursor-not-allowed'}`}
            onClick={generateTimetable}
            disabled={!isGenerateEnabled || isGeneratingRef.current}
          >
            {isGeneratingRef.current ? 'Generating...' : 'Generate Timetable'}
          </button>
        </div>
      )}

      {(role === "teacher" || role === "student") && (
        <Dashboard
          role={role}
          collegeId={collegeId}
          onLogout={backToLogin}
          onNavigate={handleNavigation}
          currentView={currentView}
          teacherTimetable={teacherTimetable}
          generatedTimetables={generatedTimetables}
          workingDays={workingDays}
          hoursPerDay={hoursPerDay}
          handleSlotToggle={handleSlotToggle}
          downloadTimetable={downloadTimetable}
        />
      )}
    </div>
  );
}
