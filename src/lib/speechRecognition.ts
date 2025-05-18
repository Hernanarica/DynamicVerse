import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

export const startListening = () => {
  try {
    SpeechRecognition.startListening({ continuous: true, language: 'es-MX' })
  } catch (error) {
    console.error('Error al iniciar el reconocimiento:', error)
  }
}

export const stopListening = () => {
  try {
    SpeechRecognition.stopListening()
  } catch (error) {
    console.error('Error al detener el reconocimiento:', error)
  }
}

export { useSpeechRecognition } 