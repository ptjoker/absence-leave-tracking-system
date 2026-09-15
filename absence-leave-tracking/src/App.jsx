import { Routes, Route } from "react-router-dom";
import Homepage from "./Homepage.jsx";
import LoginPage from "./LoginPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
