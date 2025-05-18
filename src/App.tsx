import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import './App.css'

interface Titulo {
  id: string
  nombre: string
}

interface Versiculo {
  id: string
  titulo_id: string
  texto: string
  active: boolean
  titulo: string
  created_at: string
}

interface Payload {
  new: {
    id: string
    titulo_id: string
    texto: string
    active: boolean
    created_at: string
  }
  old: {
    id: string
    titulo_id: string
    texto: string
    active: boolean
    created_at: string
  }
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}

function App() {
  const [titulos, setTitulos] = useState<Titulo[]>([])
  const [versiculos, setVersiculos] = useState<Versiculo[]>([])
  const [tituloActual, setTituloActual] = useState<Titulo | null>(null)
  const [versiculoActual, setVersiculoActual] = useState<Versiculo | null>(null)
  const [indiceActual, setIndiceActual] = useState<number>(0)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date())
  const [estaSincronizado, setEstaSincronizado] = useState<boolean>(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Función para recargar versículos
  const recargarVersiculos = useCallback(async () => {
    if (!tituloActual) return

    console.log('Recargando versículos para título:', tituloActual)
    setEstaSincronizado(false)

    const { data, error } = await supabase
      .from('versiculos')
      .select(`
        *,
        Titulos (
          nombre
        )
      `)
      .eq('titulo_id', tituloActual.id)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error al cargar versículos:', error)
      return
    }

    const versiculosConTitulo = data?.map(v => ({
      ...v,
      titulo: v.Titulos?.nombre || ''
    })) || []
    
    setVersiculos(versiculosConTitulo)
    
    const versiculoActivo = versiculosConTitulo.find(v => v.active)
    if (versiculoActivo) {
      const indiceActivo = versiculosConTitulo.findIndex(v => v.id === versiculoActivo.id)
      setIndiceActual(indiceActivo)
      setVersiculoActual(versiculoActivo)
    }

    setEstaSincronizado(true)
    setUltimaActualizacion(new Date())
  }, [tituloActual])

  // Efecto para cargar títulos
  useEffect(() => {
    const cargarTitulos = async () => {
      const { data, error } = await supabase
        .from('Titulos')
        .select('*')
      
      if (error) {
        console.error('Error al cargar títulos:', error)
        return
      }
      
      console.log('Títulos cargados:', data)
      setTitulos(data || [])
    }

    cargarTitulos()
  }, [])

  // Efecto para manejar la suscripción
  useEffect(() => {
    // Limpiar suscripción anterior si existe
    if (channelRef.current) {
      console.log('Desuscribiendo del canal anterior')
      channelRef.current.unsubscribe()
      channelRef.current = null
    }

    // Crear nueva suscripción
    console.log('Configurando nueva suscripción')
    channelRef.current = supabase
      .channel('versiculos_changes')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'versiculos'
        },
        async (payload: Payload) => {
          console.log('Cambio recibido:', payload)
          if (tituloActual && payload.new.titulo_id === tituloActual.id) {
            console.log('Cambio relevante detectado, recargando versículos')
            setEstaSincronizado(false)
            await recargarVersiculos()
            setEstaSincronizado(true)
            setUltimaActualizacion(new Date())
          }
        }
      )
      .subscribe((status) => {
        console.log('Estado de la suscripción:', status)
      })

    return () => {
      if (channelRef.current) {
        console.log('Desuscribiendo del canal')
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [tituloActual, recargarVersiculos])

  // Efecto para recargar versículos cuando cambia el título
  useEffect(() => {
    recargarVersiculos()
  }, [recargarVersiculos])

  const activarVersiculo = async (versiculo: Versiculo) => {
    setEstaSincronizado(false)
    
    try {
      // Desactivar todos los versículos
      const { error: errorDesactivar } = await supabase
        .from('versiculos')
        .update({ active: false })
        .eq('titulo_id', tituloActual?.id)

      if (errorDesactivar) throw errorDesactivar

      // Activar el versículo seleccionado
      const { error: errorActivar } = await supabase
        .from('versiculos')
        .update({ active: true })
        .eq('id', versiculo.id)

      if (errorActivar) throw errorActivar

      setVersiculoActual(versiculo)
      setEstaSincronizado(true)
      setUltimaActualizacion(new Date())
    } catch (error) {
      console.error('Error al activar versículo:', error)
      setEstaSincronizado(true)
    }
  }

  const cambiarVersiculo = async (direccion: 'siguiente' | 'anterior') => {
    if (!versiculos.length) return

    const nuevoIndice = direccion === 'siguiente' 
      ? (indiceActual + 1) % versiculos.length
      : (indiceActual - 1 + versiculos.length) % versiculos.length

    console.log('Cambiando versículo:', {
      indiceActual,
      nuevoIndice,
      versiculoActual,
      nuevoVersiculo: versiculos[nuevoIndice]
    })

    setIndiceActual(nuevoIndice)
    await activarVersiculo(versiculos[nuevoIndice])
  }

  const seleccionarTitulo = (titulo: Titulo) => {
    console.log('Seleccionando título:', titulo)
    setTituloActual(titulo)
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                {/* Selector de títulos */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Selecciona un título:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {titulos.map((titulo) => (
                      <button
                        key={titulo.id}
                        type="button"
                        onClick={() => seleccionarTitulo(titulo)}
                        className={`px-4 py-2 rounded ${
                          tituloActual?.id === titulo.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {titulo.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contenido del versículo actual */}
                {versiculoActual && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold">{versiculoActual.titulo}</h2>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${estaSincronizado ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-sm text-gray-500">
                          {estaSincronizado ? 'Sincronizado' : 'Sincronizando...'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xl mb-8">{versiculoActual.texto}</p>
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => cambiarVersiculo('anterior')}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Anterior
                      </button>
                      <div className="text-center">
                        <span className="text-gray-600 block">
                          {indiceActual + 1} de {versiculos.length}
                        </span>
                        <span className="text-xs text-gray-400">
                          Última actualización: {ultimaActualizacion.toLocaleTimeString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => cambiarVersiculo('siguiente')}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
