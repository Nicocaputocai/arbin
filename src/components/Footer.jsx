export default function Footer() {
  return (
    <footer className="bg-crema py-20 px-6 lg:px-8 border-t border-azul-noche/10">
      {/* Línea de Copyright */}
      <div className="mx-auto max-w-[1400px]  flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-azul-noche/50 font-sans text-xs tracking-wide font-bold text-center md:text-left">
          © {new Date().getFullYear()} Desarrollo i. Todos los derechos reservados.
        </p>
    <br />
      </div>
    </footer>
  );
}