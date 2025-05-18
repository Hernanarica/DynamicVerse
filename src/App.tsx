import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
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

function App() {
  const [titulos, setTitulos] = useState<Titulo[]>([])
  const [versiculos, setVersiculos] = useState<Versiculo[]>([])
  const [tituloActual, setTituloActual] = useState<Titulo | null>(null)
  const [versiculoActual, setVersiculoActual] = useState<Versiculo | null>(null)
  const [indiceActual, setIndiceActual] = useState<number>(0)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date())
  const [estaSincronizado, setEstaSincronizado] = useState<boolean>(true)

  useEffect(() => {
    // Cargar títulos
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

    // Suscribirse a cambios en versículos
    const subscription = supabase
      .channel('versiculos_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'versiculos' 
        }, 
        (payload) => {
          console.log('Cambio recibido:', payload)
          setEstaSincronizado(false)
          
          // Actualizar el estado local con los cambios
          if (payload.eventType === 'UPDATE') {
            setVersiculos(prev => {
              const nuevosVersiculos = prev.map(v => 
                v.id === payload.new.id ? (payload.new as Versiculo) : v
              )
              
              // Si el cambio fue en el versículo activo, actualizar el estado
              if (payload.new.active) {
                const nuevoIndice = nuevosVersiculos.findIndex(v => v.id === payload.new.id)
                if (nuevoIndice !== -1) {
                  setIndiceActual(nuevoIndice)
                  setVersiculoActual(payload.new as Versiculo)
                }
              }
              
              return nuevosVersiculos
            })
          }
          
          setUltimaActualizacion(new Date())
          setEstaSincronizado(true)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    // Cargar versículos cuando cambia el título actual
    const cargarVersiculos = async () => {
      if (!tituloActual) return

      console.log('Cargando versículos para título:', tituloActual)
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
      
      console.log('Versículos cargados:', data)

      // Transformar los datos para incluir el título directamente
      const versiculosConTitulo = data?.map(v => ({
        ...v,
        titulo: v.Titulos?.nombre || ''
      })) || []
      
      console.log('Versículos transformados:', versiculosConTitulo)
      
      setVersiculos(versiculosConTitulo)
      
      // Buscar el versículo activo
      const versiculoActivo = versiculosConTitulo.find(v => v.active)
      if (versiculoActivo) {
        const indiceActivo = versiculosConTitulo.findIndex(v => v.id === versiculoActivo.id)
        setIndiceActual(indiceActivo)
        setVersiculoActual(versiculoActivo)
      } else if (versiculosConTitulo.length > 0) {
        // Si no hay versículo activo, activar el primero
        setIndiceActual(0)
        await activarVersiculo(versiculosConTitulo[0])
      }

      setEstaSincronizado(true)
      setUltimaActualizacion(new Date())
    }

    cargarVersiculos()
  }, [tituloActual])

  const activarVersiculo = async (versiculo: Versiculo) => {
    setEstaSincronizado(false)
    
    // Desactivar todos los versículos
    await supabase
      .from('versiculos')
      .update({ active: false })
      .eq('titulo_id', tituloActual?.id)

    // Activar el versículo seleccionado
    await supabase
      .from('versiculos')
      .update({ active: true })
      .eq('id', versiculo.id)

    setVersiculoActual(versiculo)
    setEstaSincronizado(true)
    setUltimaActualizacion(new Date())
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
