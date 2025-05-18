import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const Dictaphone = () => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const startListening = () => {
    SpeechRecognition.startListening({ 
      continuous: true,
      language: 'es-ES'
    });
  };

  if (!browserSupportsSpeechRecognition) {
    return <span className="text-red-500">Tu navegador no soporta el reconocimiento de voz.</span>;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${listening ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-600">
          {listening ? 'Escuchando...' : 'Micrófono apagado'}
        </span>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={startListening}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Iniciar
        </button>
        <button
          onClick={SpeechRecognition.stopListening}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Detener
        </button>
        <button
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
    </div>
  );
};

export default Dictaphone;