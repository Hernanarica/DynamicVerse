declare module 'react-speech-recognition' {
  interface Command {
    command: string | string[] | RegExp
    callback: (command: string) => void
    matchInterim?: boolean
    isFuzzyMatch?: boolean
    fuzzyMatchingThreshold?: number
    bestMatchOnly?: boolean
  }

  interface UseSpeechRecognitionOptions {
    commands?: Command[]
    transcribing?: boolean
    clearTranscriptOnListen?: boolean
  }

  interface SpeechRecognitionHook {
    transcript: string
    listening: boolean
    resetTranscript: () => void
    browserSupportsSpeechRecognition: boolean
    isMicrophoneAvailable: boolean
  }

  export function useSpeechRecognition(options?: UseSpeechRecognitionOptions): SpeechRecognitionHook

  const SpeechRecognition: {
    startListening: (options?: { continuous?: boolean; language?: string }) => void
    stopListening: () => void
    abortListening: () => void
  }

  export default SpeechRecognition
} 