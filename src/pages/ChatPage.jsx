// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import PubNub from "pubnub";
import {db} from "../components/firebase";
import { addDoc, getDocs, collection } from "firebase/firestore";

export default function ChatPage() {
  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [activeChat, setActiveChat] = useState("global");
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
      message: handleMessage
    });
  
    fetchAllUsers();
  
    return () => {
      pubnubRef.current.unsubscribe({ channels });
      pubnubRef.current.removeListener({
        message: handleMessage

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
  
    setMessages((prevMessages) => {
      const channelMessages = prevMessages[event.channel] || [];
  
      // Check if the message already exists in the current state
      if (!channelMessages.some(msg => msg.timestamp === message.timestamp)) {
        const updatedMessages = {
          ...prevMessages,
          [event.channel]: [...channelMessages, message],
        };
        return updatedMessages;
      }
  
      // If the message already exists, return the previous state
      return prevMessages;
    });
  
    // Check if the message already exists in Firestore
    const querySnapshot = await getDocs(collection(db, "messages"));
    const isDuplicate = querySnapshot.docs.some(doc => {
      const data = doc.data();
      return data.channel === event.channel && data.text === message.text && data.sender === message.sender;
    });
  
    // Only add the message to Firestore if it's not a duplicate
    if (!isDuplicate) {
      await addDoc(collection(db, "messages"), {
        channel: event.channel,
        text: message.text,
        sender: message.sender,
        timestamp: message.timestamp, // Use the original timestamp from the message
      });
    }
  
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

  const sendMessage = () => {
    if (inputMessage.trim() === "") return;
  
    const messageObject = {
      text: inputMessage,
      sender: user.email,
      timestamp: new Date().toISOString(), // This timestamp is generated when sending
    };
  
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
    
    // // Unsubscribe from the previous active chat channel
    // if (activeChat !== "global") {
    //     pubnubRef.current.unsubscribe({ channels: [activeChat] });
    // }

    setActiveChat(personalChannel);
    getmessages();
    // pubnubRef.current.subscribe({ channels: [personalChannel] });
    
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <h1 className="text-2xl font-bold">Messenger</h1>
        <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded">
          Logout
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
          <h2 className="font-bold mb-2">Users</h2>
          <button
            onClick={() => {
              setActiveChat("global");
              // pubnubRef.current.subscribe({ channels: ["global"] });
              getmessages();
            }}
            className="mb-2 text-blue-500 hover:underline"
          >
            Global Chat
          </button>
          <ul>
            {allUsers.map((userEmail) => (
              <li key={userEmail} className="mb-2">
                <button
                  onClick={() => startPersonalChat(userEmail)}
                  className={`text-blue-500 hover:underline`}
                >
                  {userEmail}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 bg-white p-4 flex flex-col">
          <div className="text-lg font-bold mb-2">
            Chatting with:{" "}
            {activeChat.split("_").find((email) => email !== user.email)}
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="mb-4">
              {messages[activeChat]?.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 ${
                    msg.sender === user.email ? "text-right" : "text -left"
                  }`}
                >
                  <div
                    className={`inline-block p-2 rounded ${
                      msg.sender === user.email
                        ? "bg-blue-500 text-white"
                        : "bg-gray-300"
                    }`}
                  >
                    <strong>{msg.sender.split("@")[0]}:</strong> {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="flex mt-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              className="flex-1 border rounded p-2"
              placeholder="Type your message..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
