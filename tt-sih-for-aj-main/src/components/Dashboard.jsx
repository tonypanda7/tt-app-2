import { useState } from 'react';

const Dashboard = ({ 
  role, 
  collegeId, 
  onLogout, 
  onNavigate, 
  currentView = 'dashboard',
  teacherTimetable = [],
  generatedTimetables = {},
  workingDays = 5,
  hoursPerDay = 5,
  handleSlotToggle,
  downloadTimetable 
}) => {
  const [selectedWeekDay, setSelectedWeekDay] = useState(0);

  const weekDays = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const weekNumbers = [10, 11, 12, 13, 14];

  const subjects = [
    { name: 'Cognitive Psychology', code: 'HS2001', color: '#595880' },
    { name: 'Discrete Math', code: 'MA2003', color: '#90A9EB' },
    { name: 'Object Oriented Programming', code: 'CS2003', color: '#E1F3FF' },
    { name: 'Operating System', code: 'CS2701', color: '#EAE9D5' },
    { name: 'Artificial Intelligence', code: 'CS2007', color: '#E6E593' },
    { name: 'Exploratory Data Analysis and Data Visualization', code: 'CS2009', color: '#808251' },
    { name: 'Object Oriented Programming Lab', code: 'CS2003L', color: '#F29B70' },
    { name: 'Exploratory Data Analysis and Data Visualization Lab', code: 'CS2009L', color: '#FCE2A9' },
    { name: 'Operating System Lab', code: 'CS2807', color: '#E3D6C5' }
  ];

  const examDates = [
    { code: 'HS2001', date: '12th FEB' },
    { code: 'CS2001', date: '14th FEB' },
    { code: 'HS2001', date: '16th FEB' },
    { code: 'CS2001', date: '16th FEB' }
  ];

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM'
  ];

  const mondaySchedule = [
    { 
      subject: 'Cognitive Psychology', 
      startTime: '8:10 AM', 
      endTime: '9:00 AM', 
      color: '#595880' 
    },
    { 
      subject: 'OOPS', 
      startTime: '9:00 AM', 
      endTime: '10:40 AM', 
      color: '#D6DBF1' 
    },
    { 
      subject: 'BREAK', 
      startTime: '10:40 AM', 
      endTime: '11:00 AM', 
      color: '#FFF' 
    },
    { 
      subject: 'OOPS Lab', 
      startTime: '11:00 AM', 
      endTime: '11:50 AM', 
      color: '#F29B70' 
    },
    { 
      subject: 'DISCRETE MATH', 
      startTime: '11:50 AM', 
      endTime: '12:50 PM', 
      color: '#90A9EB' 
    },
    { 
      subject: 'BREAK', 
      startTime: '12:50 PM', 
      endTime: '1:40 PM', 
      color: '#FFF' 
    },
    { 
      subject: 'EDA', 
      startTime: '1:40 PM', 
      endTime: '2:30 PM', 
      color: '#808251' 
    },
    { 
      subject: 'BREAK', 
      startTime: '2:30 PM', 
      endTime: '2:40 PM', 
      color: '#FFF' 
    },
    { 
      subject: 'OOPS', 
      startTime: '2:40 PM', 
      endTime: '3:30 PM', 
      color: '#D6DBF1' 
    }
  ];

  const renderSidebar = () => (
    <aside className="w-full md:w-64 lg:w-72 bg-gradient-to-b from-[#E1F3FF] to-[#F0F8FF] md:rounded-r-[3rem] min-h-screen flex flex-col relative shadow-lg">
      {/* Header */}
      <div className="bg-black h-20 md:h-24 flex items-center justify-center text-white text-center">
        <span className="text-base md:text-lg lg:text-xl font-normal tracking-wide px-4">
          TIME TABLE GENERATOR
        </span>
      </div>
      
      {/* Menu button */}
      <div className="absolute top-32 md:top-40 left-6 md:left-8">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
          <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
            <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-600 rounded flex flex-col justify-center gap-1">
              <div className="w-3 h-0.5 md:w-4 md:h-0.5 bg-gray-800 mx-auto"></div>
              <div className="w-3 h-0.5 md:w-4 md:h-0.5 bg-gray-800 mx-auto"></div>
              <div className="w-3 h-0.5 md:w-4 md:h-0.5 bg-gray-800 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="mt-44 md:mt-52 space-y-6 md:space-y-8 px-6 md:px-8">
        <button 
          onClick={() => onNavigate('dashboard')}
          className={`flex items-center gap-3 md:gap-4 text-black text-lg md:text-xl font-light transition-all duration-200 hover:translate-x-1 ${
            currentView === 'dashboard' ? 'font-medium text-gray-800' : 'hover:font-medium'
          }`}
        >
          <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 32 32" fill="none">
            <path d="M4 8.00004H4.02559M4.02559 8.00004H27.9745M4.02559 8.00004C4 8.41921 4 8.93592 4 9.6003V22.4003C4 23.8938 4 24.6395 4.29065 25.2099C4.54631 25.7117 4.95396 26.1207 5.45573 26.3763C6.02561 26.6667 6.77201 26.6667 8.26259 26.6667L23.7375 26.6667C25.228 26.6667 25.9733 26.6667 26.5432 26.3763C27.045 26.1207 27.454 25.7117 27.7096 25.2099C28 24.64 28 23.8947 28 22.4041L28 9.59592C28 8.93365 28 8.41829 27.9745 8.00004M4.02559 8.00004C4.05752 7.47695 4.1293 7.10578 4.29065 6.7891C4.54631 6.28734 4.95396 5.87969 5.45573 5.62402C6.02616 5.33337 6.77345 5.33337 8.26693 5.33337H23.7336C25.2271 5.33337 25.9728 5.33337 26.5432 5.62402C27.045 5.87969 27.454 6.28734 27.7096 6.7891C27.871 7.10578 27.9427 7.47695 27.9745 8.00004M27.9745 8.00004H28" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Dashboard
        </button>

        <button 
          onClick={() => onNavigate('timetable')}
          className={`flex items-center gap-3 md:gap-4 text-black text-lg md:text-xl font-light transition-all duration-200 hover:translate-x-1 ${
            currentView === 'timetable' ? 'font-medium text-gray-800' : 'hover:font-medium'
          }`}
        >
          <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 32 32" fill="none">
            <path d="M22.666 24C22.666 24.7363 23.263 25.3333 23.9993 25.3333C24.7357 25.3333 25.3327 24.7363 25.3327 24C25.3327 23.2636 24.7357 22.6666 23.9993 22.6666C23.263 22.6666 22.666 23.2636 22.666 24Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.666 24C14.666 24.7363 15.263 25.3333 15.9993 25.3333C16.7357 25.3333 17.3327 24.7363 17.3327 24C17.3327 23.2636 16.7357 22.6666 15.9993 22.6666C15.263 22.6666 14.666 23.2636 14.666 24Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.66602 24C6.66602 24.7363 7.26297 25.3333 7.99935 25.3333C8.73573 25.3333 9.33268 24.7363 9.33268 24C9.33268 23.2636 8.73573 22.6666 7.99935 22.6666C7.26297 22.6666 6.66602 23.2636 6.66602 24Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22.666 16C22.666 16.7363 23.263 17.3333 23.9993 17.3333C24.7357 17.3333 25.3327 16.7363 25.3327 16C25.3327 15.2636 24.7357 14.6666 23.9993 14.6666C23.263 14.6666 22.666 15.2636 22.666 16Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.666 16C14.666 16.7363 15.263 17.3333 15.9993 17.3333C16.7357 17.3333 17.3327 16.7363 17.3327 16C17.3327 15.2636 16.7357 14.6666 15.9993 14.6666C15.263 14.6666 14.666 15.2636 14.666 16Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.66602 16C6.66602 16.7363 7.26297 17.3333 7.99935 17.3333C8.73573 17.3333 9.33268 16.7363 9.33268 16C9.33268 15.2636 8.73573 14.6666 7.99935 14.6666C7.26297 14.6666 6.66602 15.2636 6.66602 16Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22.666 7.99996C22.666 8.73634 23.263 9.33329 23.9993 9.33329C24.7357 9.33329 25.3327 8.73634 25.3327 7.99996C25.3327 7.26358 24.7357 6.66663 23.9993 6.66663C23.263 6.66663 22.666 7.26358 22.666 7.99996Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.666 7.99996C14.666 8.73634 15.263 9.33329 15.9993 9.33329C16.7357 9.33329 17.3327 8.73634 17.3327 7.99996C17.3327 7.26358 16.7357 6.66663 15.9993 6.66663C15.263 6.66663 14.666 7.26358 14.666 7.99996Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.66602 7.99996C6.66602 8.73634 7.26297 9.33329 7.99935 9.33329C8.73573 9.33329 9.33268 8.73634 9.33268 7.99996C9.33268 7.26358 8.73573 6.66663 7.99935 6.66663C7.26297 6.66663 6.66602 7.26358 6.66602 7.99996Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Timetable
        </button>

        <button 
          onClick={() => onNavigate('notification')}
          className={`flex items-center gap-3 md:gap-4 text-black text-lg md:text-xl font-light transition-all duration-200 hover:translate-x-1 ${
            currentView === 'notification' ? 'font-medium text-gray-800' : 'hover:font-medium'
          }`}
        >
          <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 35 32" fill="none">
            <path d="M21.8757 22.6667V24C21.8757 26.2092 19.9169 28 17.5007 28C15.0844 28 13.1257 26.2092 13.1257 24V22.6667M21.8757 22.6667H13.1257M21.8757 22.6667H27.1118C27.6696 22.6667 27.9499 22.6667 28.1758 22.597C28.6073 22.464 28.9449 22.1542 29.0904 21.7598C29.1669 21.5524 29.1669 21.2954 29.1669 20.7813C29.1669 20.5563 29.1666 20.4439 29.1474 20.3366C29.111 20.134 29.025 19.9418 28.894 19.775C28.8247 19.6869 28.7367 19.6064 28.5633 19.4478L27.9952 18.9284C27.812 18.7609 27.709 18.5336 27.709 18.2966V13.3334C27.709 8.17871 23.1386 4.00003 17.5007 4.00004C11.8628 4.00005 7.29232 8.17873 7.29232 13.3334V18.2966C7.29232 18.5336 7.18913 18.7609 7.00585 18.9284L6.43783 19.4478C6.26386 19.6068 6.17675 19.6868 6.10742 19.775C5.9764 19.9419 5.88961 20.134 5.85323 20.3366C5.83398 20.4439 5.83398 20.5564 5.83398 20.7813C5.83398 21.2954 5.83398 21.5524 5.91048 21.7597C6.05602 22.1542 6.39515 22.464 6.82662 22.597C7.05251 22.6667 7.33171 22.6667 7.88959 22.6667H13.1257M26.2777 2.68494C28.2891 4.07069 29.8736 5.90906 30.8771 8.02102M8.72435 2.68494C6.713 4.07069 5.12844 5.90906 4.125 8.02102" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Notification
        </button>
      </nav>

      {/* User section at bottom */}
      <div className="mt-auto mb-6 md:mb-8 px-6 md:px-8">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 md:gap-4 text-black text-lg md:text-xl font-light hover:font-medium transition-all duration-200 hover:translate-x-1"
        >
          <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 32 32" fill="none">
            <path d="M25.3327 28C25.3327 22.8453 21.154 18.6667 15.9993 18.6667C10.8447 18.6667 6.66602 22.8453 6.66602 28M15.9993 14.6667C13.0538 14.6667 10.666 12.2789 10.666 9.33333C10.666 6.38781 13.0538 4 15.9993 4C18.9449 4 21.3327 6.38781 21.3327 9.33333C21.3327 12.2789 18.9449 14.6667 15.9993 14.6667Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          User
        </button>
      </div>
    </aside>
  );

  const renderCalendar = () => (
    <div className="w-full max-w-md bg-white rounded-lg border border-gray-300 p-4 md:p-6 shadow-sm">
      <h3 className="text-lg md:text-xl font-bold text-black mb-4">March 2010</h3>
      
      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-xs md:text-sm text-gray-600 py-2 font-medium">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {/* Previous month dates */}
        {[28, 29, 30, 31].map((date) => (
          <div key={`prev-${date}`} className="text-center text-sm md:text-base text-gray-400 py-2 hover:bg-gray-50 rounded cursor-pointer">
            {date}
          </div>
        ))}
        
        {/* Current month dates */}
        {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
          <div key={date} className="text-center text-sm md:text-base text-black py-2 hover:bg-blue-50 rounded cursor-pointer transition-colors">
            {date}
          </div>
        ))}
        
        {/* Next month dates */}
        {[1, 2, 3, 4, 5, 6, 7].map((date) => (
          <div key={`next-${date}`} className="text-center text-sm md:text-base text-gray-400 py-2 hover:bg-gray-50 rounded cursor-pointer">
            {date}
          </div>
        ))}
      </div>
    </div>
  );

  const renderWeekSelector = () => (
    <div className="flex flex-wrap gap-2 mb-6 md:mb-8 justify-center md:justify-start">
      {weekDays.map((day, index) => (
        <button
          key={day}
          onClick={() => setSelectedWeekDay(index)}
          className={`flex flex-col items-center justify-center w-16 h-12 md:w-20 md:h-14 rounded-lg transition-all duration-200 hover:scale-105 ${
            index === selectedWeekDay ? 'bg-blue-200 bg-opacity-60 shadow-md' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          <span className="text-xs md:text-sm font-semibold text-black">{weekNumbers[index]}</span>
          <span className="text-xs md:text-sm font-medium text-black uppercase">{day}</span>
        </button>
      ))}
    </div>
  );

  const renderTimetableSlot = (slot, index) => {
    const isBreak = slot.subject === 'BREAK';
    const textColor = ['#595880', '#F29B70', '#90A9EB', '#808251'].includes(slot.color) ? 'text-white' : 'text-black';
    
    return (
      <div
        key={index}
        className="rounded-2xl flex flex-col justify-center items-center p-2 md:p-4 text-center transition-all hover:scale-105"
        style={{ 
          backgroundColor: slot.color,
          minHeight: isBreak ? (slot.subject === 'BREAK' && index === 2 ? '1.5rem' : '3rem') : '4rem'
        }}
      >
        {!isBreak && (
          <>
            <div className={`text-xs md:text-sm font-medium opacity-90 ${textColor}`}>
              {slot.startTime}
            </div>
            <div className={`text-sm md:text-base font-semibold uppercase ${textColor} my-1`}>
              {slot.subject}
            </div>
            <div className={`text-xs md:text-sm font-medium opacity-90 ${textColor}`}>
              {slot.endTime}
            </div>
          </>
        )}
        {isBreak && (
          <div className="text-xs md:text-sm font-semibold uppercase text-black">
            BREAK
          </div>
        )}
      </div>
    );
  };

  const renderMondayTimetable = () => (
    <div className="w-full bg-white rounded-2xl shadow-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base md:text-lg font-medium text-black text-center flex-1">MONDAY</h3>
        <button className="text-gray-600 transform rotate-90 hover:text-gray-800 transition-colors">
          <svg className="w-4 h-4 md:w-6 md:h-6" viewBox="0 0 12 17" fill="none">
            <path d="M2 14.8799L8.45799 8.65784L2.03424 1.99996" stroke="#999999" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      
      <div className="bg-gray-100 rounded-3xl p-4 md:p-6">
        <div className="space-y-3 md:space-y-4">
          {timeSlots.map((time, index) => (
            <div key={index} className="flex items-center gap-4 md:gap-8">
              <div className="w-12 md:w-16 text-sm md:text-base text-black text-center flex-shrink-0">
                {time}
              </div>
              <div className="flex-1">
                {mondaySchedule[index] && renderTimetableSlot(mondaySchedule[index], index)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCourseList = () => (
    <div className="w-full space-y-4">
      {subjects.slice(0, 5).map((subject, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-lg p-4 md:p-6 flex items-center gap-4 md:gap-6 hover:shadow-xl transition-shadow">
          <div className="w-20 h-20 md:w-32 md:h-28 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
            <img 
              src={`https://api.builder.io/api/v1/image/assets/TEMP/placeholder-${index}?width=263`}
              alt={subject.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTMyIiBoZWlnaHQ9IjExNiIgdmlld0JveD0iMCAwIDEzMiAxMTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMzIiIGhlaWdodD0iMTE2IiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjY2IiB5PSI2NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZTwvdGV4dD4KPHN2Zz4=';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm md:text-lg font-semibold text-black mb-1 md:mb-2 capitalize truncate">{subject.name}</h4>
            <p className="text-sm md:text-lg font-medium text-black">{subject.code}</p>
          </div>
          <div className="flex flex-col items-end gap-1 md:gap-2 flex-shrink-0">
            <span className="text-xs md:text-sm text-gray-500">Start</span>
            <span className="text-xs md:text-sm text-gray-500">July 9</span>
            <div 
              className="w-16 h-2 md:w-20 md:h-3 rounded-full"
              style={{ backgroundColor: subject.color }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderExamDates = () => (
    <div className="mb-6 md:mb-8">
      <h3 className="text-lg md:text-xl font-light text-black text-center mb-4 md:mb-6">Exam Dates</h3>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {examDates.map((exam, index) => (
          <div key={index} className="bg-black rounded-lg p-3 md:p-4 flex items-center justify-between hover:bg-gray-800 transition-colors">
            <span className="text-sm md:text-base font-medium text-white">{exam.code}</span>
            <span className="text-sm md:text-base font-medium text-white text-center leading-tight">
              {exam.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (currentView === 'timetable') {
    // Render original timetable view for both teacher and student
    if (role === 'teacher') {
      return (
        <div className="min-h-screen bg-neutral-900 text-white p-4 md:p-5">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-center">Teacher Timetable</h1>
              <button
                className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
            <div className="bg-neutral-800 p-4 md:p-6 rounded-2xl shadow-lg border border-neutral-700">
              <h2 className="text-xl font-bold mb-4">Your Timetable</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-700 text-sm">
                  <thead className="bg-neutral-700">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Day/Period</th>
                      {Array.from({ length: hoursPerDay }, (_, i) => (
                        <th key={i} className="px-4 md:px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                          Period {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-700">
                    {teacherTimetable.map((row, dayIdx) => (
                      <tr key={dayIdx}>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap font-medium text-neutral-200">Day {dayIdx + 1}</td>
                        {row.map((cell, periodIdx) => (
                          <td key={periodIdx} className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <button
                                className={`px-3 py-2 rounded-lg text-xs font-semibold w-full text-center transition-colors
                                    ${cell && cell.status === 'confirmed' ? 'bg-green-700 hover:bg-green-800 text-white' :
                                    cell && cell.status === 'sub_request' ? 'bg-yellow-600 hover:bg-yellow-700 text-neutral-900' :
                                    'bg-neutral-600 text-neutral-200 cursor-default'}`}
                                onClick={() => handleSlotToggle && handleSlotToggle(dayIdx, periodIdx, cell)}
                                disabled={!cell}
                            >
                              {cell ? (
                                <p>{cell.subjectName} <br/> ({cell.className})</p>
                              ) : (
                                <span>Free</span>
                              )}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Student view
      return (
        <div className="min-h-screen bg-neutral-900 text-white p-4 md:p-5">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-center">Student Timetable</h1>
              <button
                className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
            {Object.keys(generatedTimetables).map((clsName) => (
              <div key={clsName} className="bg-neutral-800 p-4 md:p-6 rounded-2xl shadow-lg border border-neutral-700 mb-6">
                <h2 className="text-xl font-bold mb-4">Timetable for {clsName}</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-700 text-sm">
                    <thead className="bg-neutral-700">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Day/Period</th>
                        {Array.from({ length: hoursPerDay }, (_, i) => (
                          <th key={i} className="px-4 md:px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                            Period {i + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-700">
                      {generatedTimetables[clsName].map((row, dayIdx) => (
                        <tr key={dayIdx}>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap font-medium text-neutral-200">Day {dayIdx + 1}</td>
                          {row.map((cell, periodIdx) => (
                            <td key={periodIdx} className="px-4 md:px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cell && cell.status === 'free' ? 'bg-red-700 text-white' : 'bg-neutral-600 text-neutral-200'}`}>
                                {cell ? cell.subjectName : 'N/A'}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => downloadTimetable && downloadTimetable(clsName, "xlsx")}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Download as XLSX
                  </button>
                  <button
                    onClick={() => downloadTimetable && downloadTimetable(clsName, "pdf")}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Download as PDF
                  </button>
                  <button
                    onClick={() => downloadTimetable && downloadTimetable(clsName, "txt")}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Download as TXT
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Sidebar */}
      {renderSidebar()}
      
      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-hidden">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-black uppercase tracking-wide">
            Hello {role === 'teacher' ? 'Teacher' : role === 'student' ? 'Student' : 'User'} !
          </h1>
          
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-base md:text-lg font-medium text-gray-700">N</span>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
          {/* Left section - Timetable and Exam dates */}
          <div className="xl:col-span-7 space-y-6 md:space-y-8">
            {/* Week selector */}
            {renderWeekSelector()}
            
            {/* Exam dates */}
            {renderExamDates()}
            
            {/* Monday timetable */}
            {renderMondayTimetable()}
          </div>
          
          {/* Right section - Calendar and Courses */}
          <div className="xl:col-span-5 space-y-6 md:space-y-8">
            {/* Calendar */}
            {renderCalendar()}
            
            {/* My Course section */}
            <div>
              <h3 className="text-lg md:text-xl font-light text-black text-center mb-4 md:mb-6">My Course</h3>
              {renderCourseList()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
