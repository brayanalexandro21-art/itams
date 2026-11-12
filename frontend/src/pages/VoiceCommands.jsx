import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Icono, IconoTitulo } from '../components/Icono';

const VoiceCommands = () => {
  const [commands, setCommands] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchCommands();
  }, []);

  const fetchCommands = async () => {
    try {
      const response = await api.get('/voice-commands/commands');
      setCommands(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      
      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        await processCommand(text);
      };
      
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognition.start();
    } else {
      alert('Tu navegador no soporta reconocimiento de voz');
    }
  };

  const processCommand = async (text) => {
    try {
      const response = await api.post('/voice-commands/process', { transcript: text });
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3"><IconoTitulo e="🎤" />Comandos de Voz</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Reconocimiento de Voz</h2>
        
        <div className="text-center mb-6">
          <button
            onClick={startListening}
            disabled={isListening}
            className={`w-24 h-24 rounded-full text-4xl transition-all ${
              isListening 
                ? 'bg-red-500 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            <Icono e="🎤" className="h-5 w-5" />
          </button>
          <p className="mt-4 text-gray-600">
            {isListening ? 'Escuchando...' : 'Haz clic para hablar'}
          </p>
        </div>

        {transcript && (
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-500">Escuchado:</p>
            <p className="font-medium">"{transcript}"</p>
          </div>
        )}

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={result.success ? 'text-green-800' : 'text-yellow-800'}>
              {result.message}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Comandos Disponibles</h2>
        <div className="space-y-2">
          {commands.map((cmd, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">"{cmd.command}"</span>
                <p className="text-sm text-gray-500">{cmd.description}</p>
              </div>
              <span className="text-xl"><Icono e={cmd.icon} className="h-6 w-6" /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceCommands;