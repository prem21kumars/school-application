import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { LoginPortal } from './components/auth/LoginPortal';
import { PrincipalView } from './components/principal/PrincipalView';
import { TeacherView } from './components/teacher/TeacherView';
import { StudentView } from './components/student/StudentView';
import { ParentView } from './components/parent/ParentView';

const MainContent: React.FC = () => {
  const { currentUser, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginPortal />;
  }

  if (currentUser.role === 'principal') {
    return <PrincipalView />;
  }

  if (currentUser.role === 'teacher') {
    return <TeacherView />;
  }

  return (
    <div className="app-container">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        
        <main className="main-content">
          {currentUser.role === 'student' && <StudentView />}
          {currentUser.role === 'parent' && <ParentView />}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
