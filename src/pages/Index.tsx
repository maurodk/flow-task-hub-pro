
const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-6">
        <h1 className="text-3xl font-light mb-6 text-gray-800">
          Bem-vindo
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Sua aplicação está pronta para ser personalizada
        </p>
        <nav className="space-y-3">
          <a 
            href="/sobre" 
            className="block py-2 px-4 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            Sobre
          </a>
          <a 
            href="/contato" 
            className="block py-2 px-4 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            Contato
          </a>
        </nav>
      </div>
    </div>
  );
};

export default Index;
