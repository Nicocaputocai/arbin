import Footer from './components/Footer';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="bg-crema min-h-screen selection:bg-verde-monte/20">
      <Navbar />
      
      {/* 1. HERO PRODUCTO (Estilo Tech/App) */}
      <header className="bg-azul-noche pt-40 pb-24 px-6 lg:px-8 relative overflow-hidden">
        {/* Geometría "Data" de fondo */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 right-10 w-96 h-96 border-[1px] border-crema rounded-full"></div>
          <div className="absolute top-20 right-20 w-72 h-72 border-[1px] border-verde-monte rounded-full"></div>
          <div className="absolute top-32 right-32 w-48 h-48 border-[1px] border-amarillo rounded-full"></div>
        </div>

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-verde-monte/20 border border-verde-monte/30 mb-8">
              <span className="w-2 h-2 rounded-full bg-verde-monte animate-pulse"></span>
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-crema">
                Tecnología Cívica
              </span>
            </div>

            <h1 className="font-sans text-6xl md:text-8xl font-extrabold text-crema leading-none tracking-tight mb-2">
              Arbin<span className="text-verde-monte">.</span>
            </h1>

            <p className="font-serif italic text-3xl text-crema/90 mb-6">
              Arbolado Inteligente.
            </p>

            <p className="font-sans text-lg text-crema/70 leading-relaxed max-w-lg mb-10">
              Una solución digital innovadora que agiliza el relevamiento del
              arbolado y la infraestructura urbana, conectando la precisión
              técnica con la acción territorial.
            </p>
          </div>

          {/* MOCKUP VISUAL DE LA APP CON FOTO REAL */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-full max-w-sm aspect-[9/16] bg-azul-noche/50 border border-crema/20 rounded-[3rem] p-3 shadow-2xl relative backdrop-blur-md">
              <div className="w-full h-full bg-blanco rounded-[2.2rem] overflow-hidden relative shadow-inner">
                {/* Asegurate de tener la imagen arbin-app.jpeg en la carpeta public */}
                <img
                  src="/arbin-app.jpeg"
                  alt="Interfaz de captura de datos de la App Arbin"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blanco/10 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. LOS 3 PILARES (Ventajas de la App) */}
      <section className="py-24 px-6 lg:px-8 border-b border-azul-noche/5">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8">
            {/* Eficiencia */}
            <div className="flex flex-col">
              <div className="w-16 h-16 rounded-2xl bg-amarillo/20 text-amarillo flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-sans text-2xl font-bold text-azul-noche mb-4">Eficiencia</h3>
              <p className="font-sans text-azul-noche/70 leading-relaxed">
                Agiliza el proceso de relevamiento en territorio con herramientas digitales intuitivas, eliminando el papel y la doble carga de datos.
              </p>
            </div>

            {/* Precisión */}
            <div className="flex flex-col">
              <div className="w-16 h-16 rounded-2xl bg-verde-monte/20 text-verde-monte flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-sans text-2xl font-bold text-azul-noche mb-4">Precisión</h3>
              <p className="font-sans text-azul-noche/70 leading-relaxed">
                Proporciona datos geolocalizados detallados, integrando un sistema de detección de más de 35.000 especies con un 93% de precisión.
              </p>
            </div>

            {/* Inteligencia */}
            <div className="flex flex-col">
              <div className="w-16 h-16 rounded-2xl bg-terracota/20 text-terracota flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-sans text-2xl font-bold text-azul-noche mb-4">Inteligencia</h3>
              <p className="font-sans text-azul-noche/70 leading-relaxed">
                Facilita la toma de decisiones informadas mediante el procesamiento de datos y la generación de reportes operativos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CARACTERÍSTICAS TÉCNICAS */}
      <section className="bg-blanco py-24 px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-sans text-sm font-bold uppercase tracking-[0.2em] text-terracota mb-4">
              Especificaciones
            </p>
            <h2 className="font-sans text-4xl md:text-5xl font-bold text-azul-noche mb-8">
              Un ecosistema de datos completo.
            </h2>
            <p className="font-sans text-lg text-azul-noche/70 mb-10 leading-relaxed">
              Desarrollada para soportar relevamientos masivos, Arbin cubre todo el ciclo: desde la carga en terreno hasta la visualización y exportación de bases de datos.
            </p>

            <ul className="flex flex-col gap-4 font-sans text-azul-noche/80">
              <li className="flex items-start gap-3">
                <span className="text-verde-monte mt-1">●</span>
                <span><strong>Aplicación Android nativa</strong> optimizada para la carga ágil en la vía pública.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-verde-monte mt-1">●</span>
                <span><strong>Identificación inteligente:</strong> detección de más de 35.000 especies con un 93% de precisión.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-verde-monte mt-1">●</span>
                <span><strong>Formularios dinámicos</strong> para relevamiento de arbolado e infraestructura urbana.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-verde-monte mt-1">●</span>
                <span><strong>Almacenamiento cloud</strong> seguro y sincronización de datos.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-verde-monte mt-1">●</span>
                <span><strong>Exportación en formato .CSV</strong> para integración con sistemas SIG municipales.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-verde-monte mt-1">●</span>
                <span><strong>Reportes mensuales</strong> y procesamiento estadístico.</span>
              </li>
            </ul>
          </div>

          <div className="bg-crema p-8 md:p-12 rounded-[2rem] border border-azul-noche/5 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amarillo rounded-full mix-blend-multiply opacity-50"></div>

            <h3 className="font-serif italic text-3xl text-azul-noche mb-6 relative z-10">
              Datos Abiertos Integrados
            </h3>
            <p className="font-sans text-azul-noche/70 mb-8 relative z-10">
              Arbin no es solo una herramienta de recolección cerrada. Cuenta con un <strong>Front End de Datos Abiertos</strong> diseñado para que los ciudadanos puedan visualizar la información de su ciudad, fomentando la transparencia y la participación ciudadana.
            </p>
            <a href="#" className="inline-flex items-center text-terracota font-sans font-bold hover:text-azul-noche transition-colors relative z-10">
              Explorar Catálogo Público →
            </a>
          </div>
        </div>
      </section>

      {/* 4. EL DOBLE FRENTE */}
      <section className="py-24 px-6 lg:px-8 bg-crema border-t border-azul-noche/5">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-sans text-4xl md:text-5xl font-bold text-azul-noche mb-6">
              Una herramienta, dos frentes de acción.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-azul-noche text-crema p-10 rounded-2xl flex flex-col justify-between shadow-lg">
              <div>
                <span className="inline-block px-3 py-1 bg-verde-monte/20 text-verde-monte rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
                  Gobiernos Locales
                </span>
                <h3 className="font-serif italic text-3xl mb-4">Gestión de Gobiernos Locales</h3>
                <p className="font-sans text-crema/70 leading-relaxed mb-8">
                  Arbin es la plataforma que transforma la gestión del arbolado público. Aportamos tecnología y datos para modernizar el cuidado de los espacios verdes, planificar intervenciones preventivas y gestionar el riesgo urbano de forma inteligente.
                </p>
              </div>
              <a href="mailto:info@desarrolloi.org" className="text-amarillo font-sans font-bold flex items-center hover:text-crema transition-colors">
                Solicitar demo técnica →
              </a>
            </div>

            <div className="bg-terracota text-crema p-10 rounded-2xl flex flex-col justify-between shadow-lg">
              <div>
                <span className="inline-block px-3 py-1 bg-crema/20 text-crema rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
                  Sociedad Civil
                </span>
                <h3 className="font-serif italic text-3xl mb-4">Participación Ciudadana</h3>
                <p className="font-sans text-crema/90 leading-relaxed mb-8">
                  La tecnología solo es transformadora si se apropia. Actualmente, Arbin es el motor tecnológico del programa <em>Guardianes de la Casa Común</em>, permitiendo que estudiantes de secundaria releven el arbolado de sus propios barrios.
                </p>
              </div>
              <a href="https://desarrolloi.org/guardianes" className="text-azul-noche font-sans font-bold flex items-center hover:text-crema transition-colors">
                Ver caso de uso en escuelas →
              </a>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
    
  );
}

export default App;