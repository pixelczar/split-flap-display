import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowCircleUp, 
  faPlay, 
  faPause, 
  faSliders, 
  faXmark, 
  faPlus 
} from '@fortawesome/free-solid-svg-icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ?!.,';
const MAX_CHARS = 64;
const CHARS_PER_LINE = 16;
const NUM_LINES = 4;

const SplitFlapDisplay = () => {
  const [targetText, setTargetText] = useState('HELLO WORLD');
  const [displayText, setDisplayText] = useState(' '.repeat(MAX_CHARS));
  const [inputText, setInputText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // New state for message queue functionality
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [interval, setInterval] = useState(9000);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [newQueueMessage, setNewQueueMessage] = useState('');

  // Add new state near other state declarations
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const animateToChar = (currentChar: string, targetChar: string) => {
    if (currentChar === targetChar) return currentChar;
    
    const currentIndex = CHARS.indexOf(currentChar.toUpperCase());
    const targetIndex = CHARS.indexOf(targetChar.toUpperCase());
    
    // Handle invalid characters by returning the target directly
    if (currentIndex === -1 || targetIndex === -1) return targetChar;
    
    // Calculate the shortest path to the target character
    let distance = targetIndex - currentIndex;
    if (Math.abs(distance) > CHARS.length / 2) {
      // If the distance is more than half the alphabet, go the other way
      distance = distance > 0 
        ? distance - CHARS.length 
        : distance + CHARS.length;
    }
    
    // Move one step in the correct direction
    const nextIndex = ((currentIndex + Math.sign(distance)) + CHARS.length) % CHARS.length;
    return CHARS[nextIndex];
  };

  const updateText = useCallback(() => {
    let needsUpdate = false;
    const newText = displayText.split('').map((char, i) => {
      const targetChar = i < targetText.length ? targetText[i] : ' ';
      if (char !== targetChar) {
        needsUpdate = true;
        return animateToChar(char, targetChar);
      }
      return char;
    }).join('');
    
    setDisplayText(newText);

    if (!needsUpdate) {
      setIsAnimating(false);
      if (isPlaying && currentQueueIndex < messageQueue.length - 1) {
        setTimeout(() => {
          setCurrentQueueIndex(i => i + 1);
        }, interval - 3000);
      }
    }
  }, [displayText, targetText, isPlaying, currentQueueIndex, messageQueue.length, interval]);

  useEffect(() => {
    let timer: number;
    if (isAnimating) {
      timer = window.setInterval(updateText, 50);
    }
    return () => window.clearInterval(timer);
  }, [isAnimating, displayText, targetText, isPlaying, currentQueueIndex, messageQueue, interval, updateText]);

  // Effect for auto-playing queue
  useEffect(() => {
    if (isPlaying && messageQueue.length > 0) {
      const message = messageQueue[currentQueueIndex];
      if (message) {
        displayMessage(message);
      }
    }
  }, [isPlaying, currentQueueIndex, messageQueue]);

  const displayMessage = (text: string) => {
    const trimmedText = text.slice(0, MAX_CHARS).padEnd(MAX_CHARS, ' ').toUpperCase();
    setTargetText(trimmedText);
    setIsAnimating(true);
  };

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    displayMessage(inputText);
    setMessageHistory(prev => [inputText, ...prev]);
    setInputText('');
    setHistoryIndex(-1);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (messageHistory.length > 0) {
        const newIndex = historyIndex + 1;
        if (newIndex < messageHistory.length) {
          setHistoryIndex(newIndex);
          setInputText(messageHistory[newIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputText(newIndex === -1 ? '' : messageHistory[newIndex]);
      }
    }
  };

  const addToQueue = () => {
    if (newQueueMessage.trim()) {
      setMessageQueue((prev) => [...prev, newQueueMessage]);
      setNewQueueMessage('');
    }
  };

  const removeFromQueue = (index: number) => {
    setMessageQueue(prev => prev.filter((_, i) => i !== index));
    if (currentQueueIndex >= index) {
      setCurrentQueueIndex(prev => Math.max(0, prev - 1));
    }
  };

  const togglePlayback = () => {
    if (!isPlaying && messageQueue.length > 0) {
      setCurrentQueueIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  // Split display text into lines
  const displayLines = Array.from({ length: NUM_LINES }, (_, lineIndex) => 
    displayText.slice(lineIndex * CHARS_PER_LINE, (lineIndex + 1) * CHARS_PER_LINE)
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="flex-grow flex items-center">
        <div className="bg-slate-900/50 p-12 rounded-lg backdrop-blur-sm">
          <div className="font-mono text-3xl space-y-3">
            {displayLines.map((line, lineIndex) => {
              // Calculate padding needed to center the text
              const emptySpaces = CHARS_PER_LINE - line.trim().length;
              const leftPadding = Math.floor(emptySpaces / 2);
              const centeredLine = ' '.repeat(leftPadding) + line.trim() + ' '.repeat(emptySpaces - leftPadding);
              
              return (
                <div key={lineIndex} className="flex justify-center">
                  {centeredLine.split('').map((char, charIndex) => (
                    <span
                      key={charIndex}
                      className="inline-flex items-center justify-center w-12 h-16 bg-slate-800/80 mx-0.5 rounded transition-all duration-300"
                      style={{
                        transform: isAnimating ? 'rotateX(10deg)' : 'none',
                        textShadow: '0 0 5px rgba(255,255,255,0.3)',
                      }}
                    >
                      <span className={char === ' ' ? 'text-slate-700' : 'text-white'}>
                        {char === ' ' ? '•' : char}
                      </span>
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Queue Control Dialog */}
      <div className="fixed bottom-12 left-12">
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="bg-slate-800/30 hover:bg-slate-700/30 backdrop-blur-sm"
            >
              <FontAwesomeIcon icon={faSliders} className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-slate-900/95 text-white border-slate-700
            animate-fade-in
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
            data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2
            data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]
            duration-300 transition-all"
          >
            <DialogHeader>
              <DialogTitle>Message Queue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={togglePlayback}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-slate-700/30"
                >
                  {isPlaying ? (
                    <FontAwesomeIcon icon={faPause} className="h-5 w-5" />
                  ) : (
                    <FontAwesomeIcon icon={faPlay} className="h-5 w-5" />
                  )}
                </Button>
                <div className="flex items-center space-x-2 text-sm">
                  <FontAwesomeIcon icon={faSliders} className="h-4 w-4 text-white" />
                  <Input
                    type="number"
                    value={interval}
                    onChange={(e) => setInterval(Math.max(1000, parseInt(e.target.value)))}
                    className="w-20 bg-transparent border-slate-700"
                    min="1000"
                    step="500"
                  />
                  <span className="text-slate-400">ms</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  value={newQueueMessage}
                  onChange={(e) => setNewQueueMessage(e.target.value)}
                  placeholder="Add message to queue..."
                  className="bg-transparent border-slate-700"
                  maxLength={MAX_CHARS}
                />
                <Button
                  onClick={addToQueue}
                  variant="ghost" 
                  size="sm"
                  className="hover:bg-slate-700/30"
                  disabled={!newQueueMessage.trim()}
                >
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-[200px] rounded-md border border-slate-700 p-2">
                <div className="space-y-2">
                  {messageQueue.map((message, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded ${
                        index === currentQueueIndex && isPlaying
                          ? 'bg-blue-500/20'
                          : 'bg-slate-800/30'
                      }`}
                    >
                      <span className="truncate flex-1">{message}</span>
                      <Button
                        onClick={() => removeFromQueue(index)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 hover:bg-slate-700/30 "
                      >
                        <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Message Input */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2">
        <div className="relative w-80">
          <div 
            className={`relative bg-slate-800/30 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden transition-all
              ${isFocused ? 'ring-2 ring-blue-500/30 ring-offset-2 ring-offset-slate-950' : 'ring-1 ring-slate-700/30'}`}
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => handleKeyPress(e)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type your message..."
              maxLength={MAX_CHARS}
              className="w-full bg-transparent border-0 resize-none text-white placeholder:text-slate-700 focus:ring-0 focus:outline-none pr-12 p-3 h-[70px] overflow-hidden"
              style={{ 
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)'
              }}
            />
            <Button 
              onClick={handleSubmit}
              variant="ghost"
              size="icon"
              disabled={!inputText.trim()}
              className="absolute right-2 top-8 h-8 w-8 -translate-y-[22px] transition-all
                       bg-transparent hover:bg-blue-500/10 disabled:hover:bg-transparent
                       group disabled:opacity-40 disabled:cursor-not-allowed
                       data-[eligible=true]:bg-blue-500/10 text-slate-400 data-[eligible=true]:text-blue-400"
              data-eligible={!!inputText.trim()}
            >
              <FontAwesomeIcon icon={faArrowCircleUp} className="h-5 w-5 transition-colors duration-200 
                                      data-[eligible=true]:text-blue-400
                                      group-hover:text-blue-200 group-disabled:group-hover:text-slate-400 group-disabled:cursor-not-allowed" />
            </Button>
            <div className="h-1 bg-slate-700/50 mt-0.5">
              <div 
                className="h-full transition-all duration-200 ease-in-out rounded-none"
                style={{ 
                  width: `${(inputText.length / MAX_CHARS) * 100}%`,
                  backgroundColor: inputText.length === MAX_CHARS ? '#ef4444' : '#3b82f6'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitFlapDisplay;
