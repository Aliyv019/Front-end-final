import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { UserProvider } from "./context/UserContext";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <div className="App h-full">
      <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/chats" element={<ChatPage/>} />
        </Routes>
        </UserProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
