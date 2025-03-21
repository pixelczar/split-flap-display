import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowCircleUp, 
  faPlay, 
  faPause, 
  faSliders, 
  faXmark, 
  faPlus, 
  faHistory, 
  faTrash 
} from '@fortawesome/free-solid-svg-icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Switch } from "./ui/switch"
import { Label } from "@/components/ui/label"
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { rickRubinQuotes } from '../quotes/rick-rubin';

// import "@/components/ui/switch.css";

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ?!.,';
const MAX_CHARS = 80;
const CHARS_PER_LINE = 16;
const NUM_LINES = 5;

type Message = {
  id: number;
  content: string;
  created_at: string;
};

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isCentered, setIsCentered] = useState(true);
  const [textAlignment, setTextAlignment] = useState<'center' | 'left'>('left');
  const [verticalAlignment, setVerticalAlignment] = useState<'center' | 'top'>('top');

  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [autoQuoteEnabled, setAutoQuoteEnabled] = useState(false);
  const [quoteInterval, setQuoteInterval] = useState(15); // minutes

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

  // Add effect to load initial messages and set up realtime subscription
  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data && !error) {
        setMessages(data);
      }
      setIsLoading(false);
    };

    fetchMessages();

    // Set up realtime subscription for both inserts and deletes
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;
          setMessages(current => [newMessage, ...current]);
          displayMessage(newMessage.content);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Message deleted:', payload);
          const deletedId = payload.old.id;
          setMessages(current => current.filter(msg => msg.id !== deletedId));
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup subscription
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const displayMessage = (text: string) => {
    const trimmedText = text.slice(0, MAX_CHARS).padEnd(MAX_CHARS, ' ').toUpperCase();
    setTargetText(trimmedText);
    setIsAnimating(true);
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{ content: inputText }])
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return;
      }

      // Don't update local state here, let the subscription handle it
      setInputText('');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (messages.length > 0) {
        const newIndex = historyIndex + 1;
        if (newIndex < messages.length) {
          setHistoryIndex(newIndex);
          setInputText(messages[newIndex].content);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputText(newIndex === -1 ? '' : messages[newIndex].content);
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

  // Modify the display lines logic to handle word wrapping
  const formatDisplayLines = (text: string) => {
    const lines: string[] = Array(NUM_LINES).fill('');
    const textLines = text.split('\n');
    
    const formatLine = (text: string): string => {
      const truncatedText = text.slice(0, CHARS_PER_LINE);
      
      if (textAlignment === 'center') {
        const totalPadding = CHARS_PER_LINE - truncatedText.length;
        const leftPadding = Math.floor(totalPadding / 2);
        const rightPadding = totalPadding - leftPadding;
        return ' '.repeat(leftPadding) + truncatedText + ' '.repeat(rightPadding);
      } else {
        return truncatedText.padEnd(CHARS_PER_LINE, ' ');
      }
    };

    // First, format all the lines without worrying about display position
    const formattedLines: string[] = [];
    
    for (const textLine of textLines) {
      // Handle empty lines from shift+enter
      if (textLine.trim() === '') {
        formattedLines.push(formatLine(''));
        continue;
      }

      const words = textLine.split(' ').filter(word => word.length > 0);
      let currentLineWords: string[] = [];

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const potentialLine = [...currentLineWords, word].join(' ');

        if (potentialLine.length <= CHARS_PER_LINE) {
          currentLineWords.push(word);
          if (i === words.length - 1) {
            formattedLines.push(formatLine(currentLineWords.join(' ')));
          }
        } else {
          if (currentLineWords.length > 0) {
            formattedLines.push(formatLine(currentLineWords.join(' ')));
          }
          
          if (word.length <= CHARS_PER_LINE) {
            currentLineWords = [word];
            if (i === words.length - 1) {
              formattedLines.push(formatLine(word));
            }
          } else {
            formattedLines.push(formatLine(word.slice(0, CHARS_PER_LINE)));
            currentLineWords = [];
          }
        }
      }
    }

    // Now position the formatted lines in the middle of the display area
    const startingLine = verticalAlignment === 'center'
      ? Math.max(0, Math.floor((NUM_LINES - formattedLines.length) / 2))
      : 0;
    
    // Fill lines before content with spaces
    for (let i = 0; i < startingLine; i++) {
      lines[i] = ' '.repeat(CHARS_PER_LINE);
    }
    // Add the formatted content
    for (let i = 0; i < formattedLines.length && startingLine + i < NUM_LINES; i++) {
      lines[startingLine + i] = formattedLines[i];
    }

    // Fill any remaining lines with spaces
    for (let i = startingLine + formattedLines.length; i < NUM_LINES; i++) {
      lines[i] = ' '.repeat(CHARS_PER_LINE);
    }

    return lines;
  };

  // Replace the displayLines calculation in the render section with:
  const displayLines = formatDisplayLines(displayText);

  // Add the delete handler function
  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting message:', error);
        return;
      }

      // Update local state to remove the deleted message
      setMessages(current => current.filter(msg => msg.id !== id));
    } catch (error) {
      console.error('Error in handleDelete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Add this effect to handle the automatic quotes
  useEffect(() => {
    if (!autoQuoteEnabled) return;
    
    const displayRandomQuote = () => {
      const randomIndex = Math.floor(Math.random() * rickRubinQuotes.length);
      const quote = rickRubinQuotes[randomIndex];
      displayMessage(quote);
    };

    // Display first quote immediately
    displayRandomQuote();
    
    // Set up interval
    const intervalId = setInterval(displayRandomQuote, quoteInterval * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [autoQuoteEnabled, quoteInterval]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="flex-grow flex items-center">
        <div className="bg-slate-900/50 p-12 rounded-lg backdrop-blur-sm">
          <div className="font-mono text-3xl space-y-3">
            {displayLines.map((line, lineIndex) => (
              <div key={lineIndex} className="flex justify-center">
                {line.split('').map((char, charIndex) => (
                  <span
                    key={charIndex}
                    className="inline-flex items-center justify-center w-12 h-16 bg-slate-800/80 mx-1 rounded transition-all duration-300 border border-slate-700/30"
                    style={{
                      transform: isAnimating ? 'rotateX(10deg)' : 'none',
                      textShadow: '0 0 5px rgba(255,255,255,0.3)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <span className={char === ' ' ? 'text-slate-700' : 'text-white'}>
                      {char === ' ' ? '•' : char}
                    </span>
                  </span>
                ))}
              </div>
            ))}
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
              className="opacity-60 hover:opacity-100 hover:bg-slate-800/30 hover:backdrop-blur-sm 
                border hover:border-slate-700/30 transition-all duration-200 
                hover:text-blue-400 hover:shadow-lg hover:shadow-blue-900/20 border-transparent"
            >
              <FontAwesomeIcon icon={faSliders} className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-slate-900/95 text-white border-slate-700">
            <DialogHeader>
              <DialogTitle>Display Settings</DialogTitle>
              <DialogDescription>
                Configure your split-flap display settings and automatic quotes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Text Alignment Controls */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1 mt-4">
                  <Label htmlFor="horizontal-alignment" className="text-base">Center Horizontally</Label>
                </div>
                <Switch
                  id="horizontal-alignment"
                  checked={textAlignment === 'center'} 
                  onCheckedChange={(checked) => 
                    setTextAlignment(checked ? 'center' : 'left')
                  }
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors 
                    data-[state=checked]:bg-blue-800 data-[state=unchecked]:bg-slate-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="vertical-alignment" className="text-base">Center Vertically</Label>
                </div>
                <Switch
                  id="vertical-alignment"
                  checked={verticalAlignment === 'center'}
                  onCheckedChange={(checked) => 
                    setVerticalAlignment(checked ? 'center' : 'top')
                  }
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors 
                    data-[state=checked]:bg-blue-800 data-[state=unchecked]:bg-slate-600"
                />
              </div>

              <div className="border-t border-slate-700 my-4"></div>

              {/* Queue Controls */}
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

              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between space-x-4 rounded-lg border border-slate-800 p-4 bg-slate-900/50">
                  <div className="space-y-0.5">
                    <Label 
                      htmlFor="auto-quote" 
                      className="text-sm font-medium text-slate-200"
                    >
                      Auto Display Quotes
                    </Label>
                    <p className="text-xs text-slate-400">
                      Display random Rick Rubin quotes periodically
                    </p>
                  </div>
                  <Switch
                    id="auto-quote"
                    checked={autoQuoteEnabled}
                    onCheckedChange={setAutoQuoteEnabled}
                    className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-700"
                  />
                </div>
                
                {autoQuoteEnabled && (
                  <div className="flex items-center gap-4 rounded-lg border border-slate-800 p-4 bg-slate-900/50">
                    <Label 
                      htmlFor="quote-interval" 
                      className="text-sm font-medium text-slate-200"
                    >
                      Interval (minutes)
                    </Label>
                    <Input
                      id="quote-interval"
                      type="number"
                      min="1"
                      value={quoteInterval}
                      onChange={(e) => setQuoteInterval(Number(e.target.value))}
                      className="w-24 bg-slate-800 border-slate-700 text-slate-200"
                    />
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add History Dialog - place next to existing settings dialog */}
      <div className="fixed bottom-12 left-28">
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="opacity-60 hover:opacity-100 hover:bg-slate-800/30 hover:backdrop-blur-sm 
                 hover:border-slate-700/30 transition-all duration-200 
               hover:text-blue-400 hover:shadow-lg hover:shadow-blue-900/20 border-transparent"
            >
              <FontAwesomeIcon icon={faHistory} className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-slate-900/95 text-white border-slate-700
            fixed bottom-24 left-28 translate-x-0 translate-y-0
            animate-in fade-in-0 zoom-in-95 duration-150 ease-out
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0 
            data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150 
            data-[state=closed]:ease-in-out"
          >
            <DialogHeader>
              <DialogTitle>Message History</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-20 text-slate-500">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-slate-500">
                  No messages yet
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="group flex items-center justify-between p-3 rounded bg-slate-800/30 hover:bg-slate-800/50"
                    >
                      <div className="flex-1 mr-4">
                        <p className="text-sm text-white">{message.content}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleDelete(message.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 hover:bg-slate-700/30 hover:text-red-400 transition-colors duration-200"
                        >
                          <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
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
                  backgroundColor: inputText.length === MAX_CHARS ? '#dc2626' : '#3b82f666'
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

