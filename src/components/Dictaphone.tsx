import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useState, useEffect } from 'react';

interface DictaphoneProps {
  onCambiarVersiculo: (direccion: 'siguiente' | 'anterior') => void;
}

const Dictaphone = ({ onCambiarVersiculo }: DictaphoneProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [permissionError, setPermissionError] = useState<string>('');

  const commands = [
    {
      command: ['siguiente', 'próximo', 'avanzar'],
      callback: (command: string) => {
        console.log('Comando reconocido:', command);
        onCambiarVersiculo('siguiente');
      },
      matchInterim: true
    },
    {
      command: ['anterior', 'atrás', 'retroceder'],
      callback: (command: string) => {
        console.log('Comando reconocido:', command);
        onCambiarVersiculo('anterior');
      },
      matchInterim: true
    }
  ];

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition({ 
    commands
  });

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const startListening = async () => {
    try {
      if (isMobile) {
        const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (permission) {
          SpeechRecognition.startListening({ 
            continuous: true,
            language: 'es-AR'
          });
        }
      } else {
        SpeechRecognition.startListening({ 
          continuous: true,
          language: 'es-AR'
        });
      }
      console.log('Iniciando reconocimiento de voz...');
    } catch (error) {
      console.error('Error al iniciar el reconocimiento:', error);
      setPermissionError('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  };

  const stopListening = () => {
    console.log('Deteniendo reconocimiento de voz...');
    SpeechRecognition.stopListening();
  };

  if (!browserSupportsSpeechRecognition) {
    return <span className="text-red-500">Tu navegador no soporta el reconocimiento de voz.</span>;
  }

  if (!isMicrophoneAvailable) {
    return <span className="text-red-500">No se detectó ningún micrófono.</span>;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${listening ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-600">
          {listening ? 'Escuchando...' : 'Micrófono apagado'}
        </span>
      </div>
      {permissionError && (
        <div className="text-red-500 text-sm mb-2">{permissionError}</div>
      )}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={startListening}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={listening}
        >
          Iniciar
        </button>
        <button
          type="button"
          onClick={stopListening}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          disabled={!listening}
        >
          Detener
        </button>
        <button
          type="button"
          onClick={resetTranscript}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Limpiar
        </button>
      </div>
      {transcript && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold mb-2">Texto Reconocido:</h3>
          <p className="text-gray-700">{transcript}</p>
        </div>
      )}
      <div className="mt-2 text-sm text-gray-600">
        <p>Comandos de voz disponibles:</p>
        <ul className="list-disc list-inside">
          <li>"siguiente", "próximo" o "avanzar" - Para ir al siguiente versículo</li>
          <li>"anterior", "atrás" o "retroceder" - Para ir al versículo anterior</li>
        </ul>
      </div>
    </div>
  );
};

export default Dictaphone;