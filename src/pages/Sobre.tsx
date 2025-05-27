
const Sobre = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <nav className="mb-8">
          <a 
            href="/" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Voltar
          </a>
        </nav>
        
        <div className="text-center">
          <h1 className="text-2xl font-light mb-8 text-gray-800">
            Sobre Nós
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed mb-6">
              Uma aplicação simples e elegante, construída com foco na experiência do usuário.
            </p>
            
            <p className="text-gray-600 leading-relaxed">
              Priorizamos a simplicidade e a funcionalidade em cada detalhe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sobre;
