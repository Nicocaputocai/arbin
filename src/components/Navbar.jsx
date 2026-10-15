export default function Navbar() {
  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center">
          
          {/* LADO IZQUIERDO: Logos */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Logo Desarrollo i */}
            <a 
              href="https://desarrolloi.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:opacity-80 transition-opacity"
              title="Ir a Desarrollo i"
            >
              <img src="/diLogo.png" alt="Desarrollo i" className="h-12 w-auto object-contain" />
            </a>

            {/* Separador Vertical */}
            <div className="h-10 w-px bg-slate-300"></div>

            {/* Logo Arbin */}
               <img src="/arbinLogo.svg" alt="Arbin" className="h-12 w-auto object-contain" />
          </div>

        </div>
      </div>
    </nav>
  );
}