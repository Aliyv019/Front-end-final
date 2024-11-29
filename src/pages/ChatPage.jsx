// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import PubNub from "pubnub";
import { db } from "../components/firebase";
import { addDoc, getDocs, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import these functions
import { storage } from "../components/firebase"; // Import storage

import default_pfp from "../assets/img/Default_pfp.jpg";
import sendicon from "../assets/img/send-icon.svg";
import paperclip from "../assets/img/paperclip_icon.svg";
import searchicon from "../assets/img/magnifying.svg";
import grouppfp from "../assets/img/group_pfp.png";
import logout from "../assets/img/logout.svg"
import backicon from "../assets/img/back.svg"

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
      sendFile(file); // Call the sendFile function for each file dropped
    });
  };

  const sendFile = async (file) => {
    const messageObject = {
      text: file.name,
      sender: user.email,
      timestamp: new Date().toISOString(),
    };

    // Create a storage reference
    const storageRef = ref(storage, `files/${file.name}`); // Assuming 'storage' is your Firebase Storage instance

    // Upload the file
    await uploadBytes(storageRef, file);

    // Get the file's download URL
    const fileURL = await getDownloadURL(storageRef);

    // Save the message to Firestore with the file URL
    await addDoc(collection(db, "messages"), {
      channel: activeChat,
      text: messageObject.text,
      sender: messageObject.sender,
      timestamp: messageObject.timestamp,
      file: fileURL, // Store the file URL
    });

    // Publish the message to PubNub
    pubnubRef.current.publish(
      {
        channel: activeChat,
        message: { ...messageObject, file: fileURL },
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
  console.log(activeChat);

  return (
    <div
      className="flex flex-col h-screen"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()} // Prevent default to allow drop
      onDragEnter={(e) => e.preventDefault()}
    >
      <div className="flex flex-1 h-screen ">
        {/* Chat List - Always visible on wider screens and visible on mobile when no chat is selected */}
        <div
          className={`w-full h-dvh md:w-1/4 bg-white overflow-y-auto transition-all duration-300 ${
            activeChat !== "none" && window.innerWidth < 640
              ? "hidden"
              : "block"
          }`}
        >
          <div className="flex items-center justify-between px-[29px] py-[12px] bg-[#F0F2F5]">
            <div className="flex items-center gap-4">
              <img src={default_pfp} className="w-[50px] rounded-full" alt="" />
              <h2>{user.email.split("@")[0]}</h2>
            </div>
            <div
              onClick={handleLogout}
              className="bg-white text-red-600 border-[1px] px-4 py-2 rounded cursor-pointer"
            >
              <img src={logout} className="w-[30px]" />
            </div>
          </div>
          <div className="flex items-center gap-2 px-[29px] py-[20px] relative border-b-[1px]">
            <img
              src={searchicon}
              className=" pointer-events-none absolute left-[51px] "
              alt=""
            />
            <input
              type="text"
              className="w-full px-[55px] py-[15px] border-none focus:outline-none rounded-[10px] bg-[#F0F2F5]"
              placeholder={`Search or start new chat`}
            />
          </div>
          <ul>
            <li
              className="p-2 hover:bg-gray-200 cursor-pointer flex items-center gap-2"
              onClick={() => setActiveChat("global")}
            >
              <img src={grouppfp} className="w-[50px] h-[50px]" alt="" />
              Global Chat
            </li>
            {allUsers.map((userEmail) => (
              <li
                key={userEmail}
                className="p-2 hover:bg-gray-200 cursor-pointer flex items-center gap-2"
                onClick={() => startPersonalChat(userEmail)}
              >
                <img src={default_pfp} className="w-[50px] rounded-full" alt="" />
                {userEmail}
              </li>
            ))}
          </ul>
        </div>

        {/* Chat Area - Always visible when a chat is selected */}
        <div
          className={`flex-1 flex h-dvh justify-between flex-col bg-background ${
            activeChat !== "none" ? "block" : "hidden"
          } md:flex`}
        >
          <div
            className={`flex items-center   mb-2 h-[74px] px-5 bg-[#F0F2F5] gap-4`}
          >
            <div
              onClick={() => setActiveChat("none")}
              className="text-black px-2 py-1 rounded md:hidden cursor-pointer"
            >
              <img src={backicon} className="w-[15px]" />
            </div>
            <div className={`flex items-center gap-4 `}>
              <img
                src={default_pfp}
                className={`h-[50px] w-[50px] rounded-full ${activeChat === "none" ? "hidden" : ""}`}
                alt=""
              />
              <h2 className="text-xl font-semibold">
                {activeChat === "none" ? "Please select a chat or start one" : activeChat.split("_")[0].split("@")[0]}
              </h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto mb-4 m-4">
            {messages[activeChat]?.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === user.email ? "justify-end" : "justify-start"
                } mb-4`}
              >
                <div
                  className={`max-w-[70%] ${
                    msg.sender === user.email
                      ? "bg-[#D9FDD3] rounded-tr-none"
                      : "bg-white rounded-tl-none"
                  } rounded-[10px] px-4 py-2 shadow-md flex flex-col`}
                >
                  {!msg.sender === user.email && (
                    <div className="text-sm font-semibold text-gray-600 mb-1">
                      {msg.sender.split("@")[0]}
                    </div>
                  )}
                  <div className="break-words mr-8">{msg.text}</div>
                  <div className={`text-xs text-[#111B21]  text-end`}>
                    {new Date(msg.timestamp).toLocaleTimeString().slice(0, 5)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Field */}

          <div
            className={`flex mt-4 p-2 border-t justify-center bg-grey-custom shadow-md gap-1 ${
              activeChat === "none" ? "hidden" : "block"
            }`}
          >
            <div
              onClick={sendFile}
              className=" rounded-[4px] w-[48px] bg-none hover:bg-slate-300 p-2 flex cursor-pointer duration-300 justify-center items-center"
            >
              <img src={paperclip} className="w-4" alt="" />
            </div>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              className="flex-1 border rounded-[10px] p-2 focus:outline-none "
              placeholder="Type a message..."
            />
            <div
              onClick={sendMessage}
              className="bg-[#F0F2F5] text-white p-4 rounded-[4px] flex justify-center items-center hover:bg-slate-300 focus:outline-none cursor-pointer duration-300"
            >
              <img src={sendicon} className="w-4" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
