// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import PubNub from "pubnub";
import { db } from "../components/firebase";
import { addDoc, getDocs, collection } from "firebase/firestore";

export default function ChatPage() {
  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [activeChat, setActiveChat] = useState("none");
  const messagesEndRef = useRef(null);
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const pubnubRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    pubnubRef.current = new PubNub({
      publishKey: "pub-c-ffe1f819-f3a1-4a89-a787-3d0ece760468",
      subscribeKey: "sub-c-3da15639-dfb5-4f48-b345-a08fe215a9c8",
      userId: user.email,
    });

    const channels = ["global", user.email];
    pubnubRef.current.subscribe({ channels });

    pubnubRef.current.addListener({
      message: handleMessage,
    });

    fetchAllUsers();

    return () => {
      pubnubRef.current.unsubscribe({ channels });
      pubnubRef.current.removeListener({
        message: handleMessage,
      });
    };
  }, [user, navigate]);

  const fetchAllUsers = () => {
    const mockUsers = [
      "gecenyx@gmail.com",
      "tahiraliyev2006@gmail.com",
      "mceferov@gmail.com",
    ];
    setAllUsers(mockUsers.filter((u) => u !== user.email));
  };

  const handleMessage = async (event) => {
    const message = event.message;

    // Check if the message already exists in the local state
    setMessages((prevMessages) => {
      const channelMessages = prevMessages[event.channel] || [];

      // Check for duplicates in local state
      if (
        !channelMessages.some(
          (msg) =>
            msg.timestamp === message.timestamp && msg.text === message.text
        )
      ) {
        const updatedMessages = {
          ...prevMessages,
          [event.channel]: [...channelMessages, message],
        };
        return updatedMessages;
      }

      return prevMessages; // Return previous state if duplicate found
    });

    // No need to check Firestore here since we already saved the message when sending
    scrollToBottom();
  };

  // Load messages from Firestore when the component mounts
  const getmessages = async (channel) => {
    const querySnapshot = await getDocs(collection(db, "messages"));
    const allMessages = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!allMessages[data.channel]) {
        allMessages[data.channel] = [];
      }
      allMessages[data.channel].push(data);
    });
  };
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      sendFile(file);
    });
  };

  const sendFile = async (file) => {
    const messageObject = {
      text: file.name, // You can modify this to suit your needs
      sender: user.email,
      timestamp: new Date().toISOString(),
      file: URL.createObjectURL(file), // Create a URL for the file
    };

    await addDoc(collection(db, "messages"), {
      channel: activeChat,
      text: messageObject.text,
      sender: messageObject.sender,
      timestamp: messageObject.timestamp,
      file: messageObject.file,
    });

    pubnubRef.current.publish(
      {
        channel: activeChat,
        message: messageObject,
      },
      (status, response) => {
        if (status.error) {
          console.error("Error sending message:", status);
        } else {
          setInputMessage(""); // Clear input after sending
        }
      }
    );
  };
  useEffect(() => {
    const fetchMessages = async () => {
      const querySnapshot = await getDocs(collection(db, "messages"));
      const allMessages = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!allMessages[data.channel]) {
          allMessages[data.channel] = [];
        }
        allMessages[data.channel].push(data);
      });
      setMessages(allMessages);
      console.log("Messages:", allMessages);
    };
    fetchMessages();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (inputMessage.trim() === "") return;

    const messageObject = {
      text: inputMessage,
      sender: user.email,
      timestamp: new Date().toISOString(), // This timestamp is generated when sending
    };

    // Save the message to Firestore immediately when sending
    await addDoc(collection(db, "messages"), {
      channel: activeChat,
      text: messageObject.text,
      sender: messageObject.sender,
      timestamp: messageObject.timestamp,
    });

    pubnubRef.current.publish(
      {
        channel: activeChat,
        message: messageObject,
      },
      (status, response) => {
        if (status.error) {
          console.error("Error sending message:", status);
        } else {
          setInputMessage(""); // Clear input after sending
        }
      }
    );
  };

  const startPersonalChat = (recipientEmail) => {
    const personalChannel = [user.email, recipientEmail].sort().join("_");

    // Unsubscribe from the previous active chat channel
    if (activeChat !== "global" || "none") {
      pubnubRef.current.unsubscribe({ channels: [activeChat] });
    }

    setActiveChat(personalChannel);
    getmessages();
    pubnubRef.current.subscribe({ channels: [personalChannel] });
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  return (
    <div
      className="flex flex-col h-screen"
      onDrop={handleDrop}
      onDrag={(e) => e.preventDefault()}
    >
      <div className="bg-blue-600 p-4 text-white fixed w-full z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Messenger</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex flex-1 mt-16">
        {/* Chat List - Always visible on wider screens and visible on mobile when no chat is selected */}
        <div
          className={`w-full md:w-1/4 bg-gray-100 p-4 overflow-y-auto transition-all duration-300 ${
            activeChat !== "none" && window.innerWidth < 640
              ? "hidden"
              : "block"
          }`}
        >
          <h2 className="text-lg font-semibold">Chats</h2>
          <ul>
            <li
              className="p-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => setActiveChat("global")}
            >
              Global Chat
            </li>
            {allUsers.map((userEmail) => (
              <li
                key={userEmail}
                className="p-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => startPersonalChat(userEmail)}
              >
                {userEmail}
              </li>
            ))}
          </ul>
        </div>

        {/* Chat Area - Always visible when a chat is selected */}
        <div
          className={`flex-1 p-4 flex justify-between flex-col ${
            activeChat !== "none" ? "block" : "hidden"
          } md:flex`}
        >
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setActiveChat("none")}
              className="bg-gray-300 text-black px-2 py-1 rounded md:hidden"
            >
              Back
            </button>
            <h2 className="text-xl font-semibold">
              Chat:{" "}
              {activeChat
                .split("_")
                .map((user) => user.split("@")[0])
                .join(" and ")}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto mb-4">
            {messages[activeChat]?.map((msg, index) => (
              <div
                key={index}
                className={`my-2 ${
                  msg.sender === user.email ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-2 rounded ${
                    msg.sender === user.email
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300"
                  }`}
                >
                  <strong>{msg.sender.split("@")[0]}: </strong>
                  {msg.text}
                  {msg.file && (
                    <a
                      href={msg.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 underline"
                    >
                      Download {msg.text}
                    </a>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex mt-4 p-2 border-t border-gray-300 bg-gray-50 rounded-lg shadow-md">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              {...(activeChat === "none" ? { disabled: true } : {})}
              className="flex-1 border rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition duration-300"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
