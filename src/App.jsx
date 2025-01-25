import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jsPDF } from "jspdf";

// Utility function to escape HTML characters for secure rendering
function escapeHTML(input) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speech, setSpeech] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [greeting, setGreeting] = useState("");
  const [isGreetingVisible, setIsGreetingVisible] = useState(true); // For controlling the visibility of the greeting

  // Function to get the greeting based on the current time
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return "Good Morning!";
    } else if (currentHour < 18) {
      return "Good Afternoon!";
    } else {
      return "Good Evening!";
    }
  };

  // Update the greeting message when the component mounts
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);


  const handleSpeech = (text) => {
    if (isPlaying) {
      responsiveVoice.pause();
      setIsPlaying(false);
    } else {
        // Remove the '*', '(' and ')' characters from the text
      const filteredText = text.replace(/[\*\(\)]/g, "");
  
      const chunkSize = 1500;
      let currentIndex = 0;
  
      // Recursive function to speak the next chunk
      const speakNextChunk = () => {
        const chunk = filteredText.slice(currentIndex, currentIndex + chunkSize);
        if (chunk) {
          responsiveVoice.speak(chunk, "UK English Male", {
            rate: 1.2,
            onend: () => {
              currentIndex += chunkSize;
              if (currentIndex < filteredText.length) {
                speakNextChunk();
              } else {
                setIsPlaying(false);
              }
            },
          });
        }
      };
  
      speakNextChunk();
      setIsPlaying(true);
    }
  };
  
  // Function to generate a response using the API
  async function generateAnswer() {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt.");
      return;
    }
  
    // Pause the audio if it's playing
    if (isPlaying) {
      responsiveVoice.pause();
      setIsPlaying(false);
    }
  
    setLoading(true);
    setResponse(null);
  
    try {
      // API call to generate a response
      let res = await axios({
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyALggixLhmAiY7eOdhU7DX5HgK08N7t5jE",
        method: "POST",
        data: {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        },
      });
  
       // Process the API response and update the state
      const generatedText =
        res.data.candidates?.map((candidate) => candidate.content?.parts[0]?.text).join("\n") ||
        "No response received.";
  
      setResponse(generatedText);
      handleSpeech(generatedText); // Automatically play the new response if needed
    } catch (error) {
      toast.error("An error occurred while generating the response. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  

  const copyToClipboard = () => {
    if (response) {
      navigator.clipboard.writeText(response).then(() => {
        toast.success("Copied to clipboard!");
      });
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
  
    if (!response) {
      alert("No text to download.");
      return;
    }

    const cleanedResponse = response
      .replace(/```/g, "")
      .replace(/\*\*/g, "")
      .replace(/\n{2,}/g, "\n\n");

    let yPosition = 30;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    const lines = doc.splitTextToSize(cleanedResponse, maxWidth);

    lines.forEach((line) => {
      if (yPosition + 10 > pageHeight) {
        doc.addPage();
        yPosition = 30;
      }

      doc.text(line, margin, yPosition);
      yPosition += 10;
    });

    doc.save("Neura.pdf");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const closeGreeting = () => {
    setIsGreetingVisible(false); // Hide the greeting when the close button is clicked
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
      {/* Greet message at the top left with background and close button */}
      {isGreetingVisible && (
        <motion.div
          className="absolute top-4 left-4 p-4 rounded-lg bg-blue-600 text-white font-semibold flex items-center space-x-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span>{greeting}</span>
          <button onClick={closeGreeting} className="mt-1 text-white rounded-full flex items-center justify-center shadow-md focus:outline-none">
            <i className="fas fa-times text-lg"></i>
          </button>
        </motion.div>
      )}

      {/* Toggle button for dark/light mode */}
      <motion.button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full text-3xl text-white"
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </motion.button>

      <motion.h1
        className={`text-3xl lg:text-4xl md:text-4xl font-semibold mb-6 ${theme === "dark" ? "text-white" : "text-black"}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        What can I help with?
      </motion.h1>

      <motion.textarea
        className={`w-full h-32 max-w-2xl p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 text-lg ${theme === "dark" ? "bg-gray-800 text-white border border-gray-600" : "bg-[#F9F9F9] text-black border border-gray-300"}`}
        placeholder="Type your prompt here..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      ></motion.textarea>

      <div className="flex items-center space-x-4 flex-wrap justify-center">
        {response && (
          <motion.button
            onClick={() => handleSpeech(response)}
            className="w-11 lg:w-12 md:w-12 mt-2 h-12 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 transition duration-300 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {isPlaying ? (
              <i className="fas fa-pause text-2xl"></i>
            ) : (
              <i className="fas fa-play text-2xl"></i>
            )}
          </motion.button>
        )}

        <motion.button
          onClick={generateAnswer}
          disabled={loading}
          className={`w-24 md:w-28 lg:w-28 h-12 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 flex items-center justify-center ${loading && "opacity-50 cursor-not-allowed"} text-lg lg:text-xl md:text-xl mt-2`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {loading ? (
            <div className="animate-spin w-5 h-5 sm:text-md border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            "Generate"
          )}
        </motion.button>

        {response && (
          <motion.button
            onClick={copyToClipboard}
            className="w-20 md:w-24 lg:w-24 h-12 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300 text-lg lg:text-xl md:text-xl mt-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            Copy
          </motion.button>
        )}

        {response && (
          <motion.button
            onClick={downloadPDF}
            className="w-11 md:w-12 lg:w-12 h-12 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300 flex items-center justify-center mt-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <i className="fas fa-download text-2xl"></i>
          </motion.button>
        )}
      </div>

      <div className="mt-6 w-full max-w-2xl">
        {response && (
          <motion.pre
            className={`p-6 border rounded-lg shadow-md text-lg ${theme === "dark" ? "bg-gray-800 border-gray-500 text-gray-300" : "bg-gray-100 text-gray-900 border-gray-100"}`}
            style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              fontFamily: "sans-serif",
            }}
            dangerouslySetInnerHTML={{
              __html: escapeHTML(response)
                .replace(/```/g, "")
                .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
                .replace(/\n{3,}/g, "\n\n")
                .replace(/\*/g, "&#8226;"),
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          ></motion.pre>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}

export default App;