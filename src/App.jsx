import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// 🔐 Login
import Login from "./pages/Login";

// 🏠 Church main
import ChurchHome from "./churches/KBBT/ChurchHome";

// ✝️ Next Step
import NextStepHome from "./churches/KBBT/NextStep/ServiceHome";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedNextStep from "./components/ProtectedNextStep";

// 🙏 Prayers
import Prayers from "./churches/KBBT/Prayers/Prayers.jsx";

// 🎵 Worship
import WorshipHome from "./churches/KBBT/Worship/WorshipHome";

// 🧾 Membership
import MembershipHome from "./churches/KBBT/Membership/MembershipHome";
import MemberProfile from "./churches/KBBT/Membership/MemberProfile";

// 🧠 Discipleship
import DiscipleshipHome from "./churches/KBBT/Discipleship/DiscipleshipHome";
import CoursesSetup from "./churches/KBBT/Discipleship/CoursesSetup";
import LessonViewer from "./churches/KBBT/Discipleship/LessonViewer";
import CoursesManager from "./churches/KBBT/Discipleship/courses/CoursesManager";

// 📚 Course Library (Materialet e Kurseve)
import CourseLibrary from "./churches/KBBT/Discipleship/CourseLibrary";

// 🧾 Lessons Manager – për menaxhimin e mësimeve në çdo kurs
import LessonsManager from "./churches/KBBT/Discipleship/lessons/LessonsManager";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔐 Login */}
        <Route path="/" element={<Login />} />

        {/* 🏠 Main Church Dashboard */}
        <Route
          path="/:churchSlug"
          element={
            <ProtectedRoute>
              <ChurchHome />
            </ProtectedRoute>
          }
        />

        {/* ✝️ Next Step */}
        <Route
          path="/:churchSlug/nextstep"
          element={
            <ProtectedRoute>
              <ProtectedNextStep>
                <NextStepHome />
              </ProtectedNextStep>
            </ProtectedRoute>
          }
        />

        {/* 🙏 General Prayers */}
        <Route
          path="/:churchSlug/prayers"
          element={
            <ProtectedRoute>
              <Prayers />
            </ProtectedRoute>
          }
        />

        {/* 🙏 Service-Specific Prayers */}
        <Route
          path="/:churchSlug/:serviceSlug/prayers"
          element={
            <ProtectedRoute>
              <Prayers />
            </ProtectedRoute>
          }
        />

        {/* 🎵 Worship */}
        <Route
          path="/:churchSlug/worship"
          element={
            <ProtectedRoute>
              <WorshipHome />
            </ProtectedRoute>
          }
        />

        {/* 🧾 Membership */}
        <Route
          path="/:churchSlug/membership"
          element={
            <ProtectedRoute>
              <MembershipHome />
            </ProtectedRoute>
          }
        />

        {/* 👤 Member Profile */}
        <Route
          path="/:churchSlug/membership/:memberId"
          element={
            <ProtectedRoute>
              <MemberProfile />
            </ProtectedRoute>
          }
        />

        {/* 🧠 Discipleship Home */}
        <Route
          path="/:churchSlug/discipleship"
          element={
            <ProtectedRoute>
              <DiscipleshipHome />
            </ProtectedRoute>
          }
        />

        {/* 🏫 Discipleship – Course Registration Setup */}
        <Route
          path="/:churchSlug/discipleship/courses"
          element={
            <ProtectedRoute>
              <CoursesSetup />
            </ProtectedRoute>
          }
        />

        {/* 🧩 Discipleship – Course Manager */}
        <Route
          path="/:churchSlug/discipleship/courses/manage"
          element={
            <ProtectedRoute>
              <CoursesManager />
            </ProtectedRoute>
          }
        />

        {/* 🧾 Discipleship – Lessons Manager (për çdo kurs veç) */}
        <Route
          path="/:churchSlug/discipleship/courses/:courseId/lessons"
          element={
            <ProtectedRoute>
              <LessonsManager />
            </ProtectedRoute>
          }
        />

        {/* 📚 Discipleship – Course Library (Materialet e Kurseve) */}
        <Route
          path="/:churchSlug/discipleship/course-library"
          element={
            <ProtectedRoute>
              <CourseLibrary />
            </ProtectedRoute>
          }
        />

        {/* 📖 Discipleship – Lesson Viewer (Flip Book për studentin) */}
        <Route
          path="/:churchSlug/discipleship/course/:courseId"
          element={
            <ProtectedRoute>
              <LessonViewer />
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* 🔔 Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: "14px" },
        }}
      />
    </BrowserRouter>
  );
}
