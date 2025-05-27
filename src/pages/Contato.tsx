
const Contato = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-6">
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
            Contato
          </h1>
          
          <div className="space-y-4 text-gray-600">
            <p>
              <span className="block text-sm text-gray-500 mb-1">Email</span>
              contato@exemplo.com
            </p>
            
            <p>
              <span className="block text-sm text-gray-500 mb-1">Telefone</span>
              (11) 9999-9999
            </p>
            
            <p>
              <span className="block text-sm text-gray-500 mb-1">Endereço</span>
              São Paulo, SP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contato;
