
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeChatSession, sendMessageToChat, generateImage } from './services/geminiService';
import { DisplayMessage, CorrectAnswersCount, GeminiHistoryPart } from './types';
import { TARGET_MESSAGE_PARTS_TEXT, GAME_TITLE, PHOS_NAME_DECORATED, INITIAL_SYSTEM_PROMPT, MAX_CORRECT_ANSWERS } from './constants';
import LoadingSpinner from './components/LoadingSpinner';
import Modal from './components/Modal';

const App: React.FC = () => {
  const [correctAnswersCount, setCorrectAnswersCount] = useState<CorrectAnswersCount>(0);
  const [displayedChat, setDisplayedChat] = useState<DisplayMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFinalMessageModalOpen, setIsFinalMessageModalOpen] = useState<boolean>(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null); // Used for the main image display

  const chatHistoryRef = useRef<GeminiHistoryPart[]>([]);
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [displayedChat]);

  // Adds a message to the chat display and updates the main image if provided
  const addMessageToDisplay = useCallback((speaker: 'game' | 'user' | 'system', text: string, imageUrlToSet?: string) => {
    const newMessage: DisplayMessage = { 
      id: Date.now().toString() + Math.random(), 
      speaker, 
      text, 
      imageUrl: speaker === 'game' ? imageUrlToSet : undefined // Only game messages get an image in the chat bubble
    };
    setDisplayedChat(prev => [...prev, newMessage]);
    if (speaker === 'game' && imageUrlToSet) {
        setCurrentImageUrl(imageUrlToSet); // Update the main image panel
    }
  }, []);


  const processGameLogic = useCallback(async (gameResponseText: string) => {
    setIsLoading(true);
    // Add Gemini's response to history
    chatHistoryRef.current.push({ role: 'model', parts: [{ text: gameResponseText }] });

    let newCorrectAnswersCount = correctAnswersCount;
    let gameWonThisTurn = false;

    const strippedResponseText = gameResponseText
        .replace(/\[CORRECT_ANSWER\]/g, '')
        .replace(/\[ALL_ANSWERS_CORRECT\]/g, '')
        .trim();

    const newImg = await generateImage(strippedResponseText || "Abstract musical celebration");
    addMessageToDisplay('game', strippedResponseText, newImg);

    if (gameResponseText.includes('[CORRECT_ANSWER]')) {
      if (correctAnswersCount < MAX_CORRECT_ANSWERS) {
        newCorrectAnswersCount = (correctAnswersCount + 1) as CorrectAnswersCount;
        setCorrectAnswersCount(newCorrectAnswersCount);
      }
    }

    if (gameResponseText.includes('[ALL_ANSWERS_CORRECT]') && newCorrectAnswersCount === MAX_CORRECT_ANSWERS) {
      gameWonThisTurn = true;
      setIsFinalMessageModalOpen(true);
      // The gameResponseText itself will contain the celebratory message.
      // An additional image for the modal could be generated here if desired,
      // but the main image is already updated.
    }
    
    // If Gemini's response indicates a correct answer but not the final one,
    // the system prompt directs it to ask the next question.
    // No explicit "next stage narrative" push is needed from here, as Gemini handles it.

    setIsLoading(false);
  }, [addMessageToDisplay, correctAnswersCount]);


  useEffect(() => {
    const startGame = async () => {
      setIsLoading(true);
      setError(null);
      setCorrectAnswersCount(0);
      setDisplayedChat([]);
      setCurrentImageUrl(null);
      chatHistoryRef.current = []; 

      try {
        // Initialize chat. The INITIAL_SYSTEM_PROMPT will guide Gemini.
        await initializeChatSession(chatHistoryRef.current); // System prompt is set up here

        // Send a message to kick off the game, Gemini should respond with the first question.
        const startGameTrigger = "Let's start Pho's 20th Birthday Mixtape Challenge!";
        chatHistoryRef.current.push({ role: 'user', parts: [{ text: startGameTrigger }] });
        
        const firstQuestionText = await sendMessageToChat(startGameTrigger, chatHistoryRef.current);
        chatHistoryRef.current.push({ role: 'model', parts: [{ text: firstQuestionText }] });

        const imageUrl = await generateImage(firstQuestionText);
        addMessageToDisplay('game', firstQuestionText, imageUrl);

      } catch (e) {
        console.error("Failed to initialize game:", e);
        const errorMsg = "Oh no! The DJ booth is having technical difficulties. We couldn't start the Mixtape Challenge. Please check the ancient scrolls (console) or refresh the page.";
        setError(errorMsg);
        addMessageToDisplay('system', errorMsg, undefined);
      } finally {
        setIsLoading(false);
      }
    };
    startGame();
  }, [addMessageToDisplay]); // Add addMessageToDisplay to dependencies


  const handleUserInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading || correctAnswersCount === MAX_CORRECT_ANSWERS) return;

    setIsLoading(true);
    setError(null);
    addMessageToDisplay('user', trimmedInput, undefined); // User messages don't have images in the bubble
    chatHistoryRef.current.push({ role: 'user', parts: [{ text: trimmedInput }] });
    setUserInput(''); 

    try {
      const responseText = await sendMessageToChat(trimmedInput, chatHistoryRef.current);
      await processGameLogic(responseText);
    } catch (e) {
      console.error("Error sending message:", e);
      const errorMsg = "A record scratch! We couldn't send your answer. Try again, or consult the sound engineers (console).";
      setError(errorMsg);
      addMessageToDisplay('system', errorMsg, undefined);
      // Optionally pop the user's message from history if the API call failed severely
      // chatHistoryRef.current.pop(); 
    } finally {
      // setIsLoading(false); // processGameLogic will set this
    }
  };
  
  const finalMessageHTML = TARGET_MESSAGE_PARTS_TEXT.map(part => part.replace(PHOS_NAME_DECORATED, `<strong class="font-bold text-pink-400 special-char">${PHOS_NAME_DECORATED}</strong>`)).join("<br/><br/>");

  const isGameWon = correctAnswersCount === MAX_CORRECT_ANSWERS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-slate-200 flex flex-col items-center p-4 selection:bg-pink-500 selection:text-white">
      <header className="w-full max-w-4xl text-center my-6">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">{GAME_TITLE}</h1>
      </header>

      <main className="w-full max-w-4xl flex-grow flex flex-col md:flex-row gap-4 bg-slate-800 bg-opacity-50 shadow-2xl rounded-lg p-2 md:p-6">
        {/* Left Panel: Image and Score */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="aspect-square bg-slate-700 rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
            {isLoading && !currentImageUrl && displayedChat.length === 0 && <LoadingSpinner message="Setting up the stage..." />}
            {currentImageUrl && <img src={currentImageUrl} alt="Current game scene" className="w-full h-full object-cover" />}
            {!isLoading && !currentImageUrl && <div className="text-slate-400 p-4 text-center">The stage lights are warming up...</div>}
          </div>
          <div className="bg-slate-700 bg-opacity-70 p-4 rounded-lg shadow-md flex-grow">
            <h2 className="text-xl font-semibold mb-3 text-pink-400 border-b-2 border-pink-500 pb-2">Your Score</h2>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-300">{correctAnswersCount} <span className="text-xl text-slate-300">/ {MAX_CORRECT_ANSWERS}</span></p>
              <p className="text-sm text-slate-400 mt-1">Correct Grooves</p>
              {isGameWon && <p className="mt-3 text-lg text-yellow-300 font-semibold animate-pulse">Mixtape Mastered!</p>}
            </div>
          </div>
        </div>

        {/* Right Panel: Chat Log and Input */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <div className="bg-slate-700 bg-opacity-70 p-4 rounded-lg shadow-md flex-grow h-96 md:h-[calc(100%-10rem)] overflow-y-auto rich-text-display">
            <h2 className="text-xl font-semibold mb-3 text-purple-400 border-b-2 border-purple-500 pb-2">DJ Rhapsody's Booth</h2>
            {displayedChat.map((msg) => (
              <div key={msg.id} className={`mb-3 p-3 rounded-lg max-w-[90%] clear-both ${
                msg.speaker === 'user' ? 'bg-indigo-600 ml-auto text-right float-right' :
                msg.speaker === 'game' ? 'bg-purple-700 mr-auto float-left' :
                'bg-red-700 mr-auto text-center' // System messages
              }`}>
                <p className={`text-xs font-semibold mb-1 ${msg.speaker === 'user' ? 'text-indigo-200' : msg.speaker === 'game' ? 'text-purple-200' : 'text-red-200'}`}>
                  {msg.speaker === 'user' ? 'You' : msg.speaker === 'game' ? 'DJ Rhapsody' : 'System Control'}
                </p>
                <div dangerouslySetInnerHTML={{__html: msg.text.replace(/\n/g, "<br />")}} className="text-sm leading-relaxed"/>
                {/* Images in chat bubbles can be distracting if main image panel is used. Kept conditional. */}
                {/* {msg.speaker === 'game' && msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Scene illustration" className="mt-2 rounded-md max-w-full h-auto"/>
                )} */}
              </div>
            ))}
            <div ref={chatEndRef} />
            {isLoading && displayedChat.length > 0 && <div className="clear-both"><LoadingSpinner size="sm" message="Mixing next track..."/></div>}
          </div>
          <form onSubmit={handleUserInputSubmit} className="bg-slate-700 bg-opacity-70 p-4 rounded-lg shadow-md">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={isGameWon ? "You've mastered the mixtape!" : "Drop your answer here..."}
              className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors text-slate-200 resize-none h-24"
              rows={3}
              disabled={isLoading || isGameWon}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleUserInputSubmit(e as any); 
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || isGameWon || !userInput.trim()}
              className="mt-3 w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Spinning...' : 'Send Answer'}
            </button>
            {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
          </form>
        </div>
      </main>

      <Modal isOpen={isFinalMessageModalOpen} onClose={() => setIsFinalMessageModalOpen(false)} title={`🎉 You Nailed It, ${PHOS_NAME_DECORATED}! 🎉`}>
        <div className="space-y-4 text-center text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: finalMessageHTML }} />
        <img 
            src={currentImageUrl || `https://picsum.photos/seed/${encodeURIComponent("birthday party celebration music")}/400/200`} 
            alt="Final Celebration" 
            className="mt-6 rounded-lg mx-auto shadow-lg max-h-60 object-contain"
        />
      </Modal>
    </div>
  );
};

export default App;
