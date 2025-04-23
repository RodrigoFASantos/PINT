const fs = require('fs');
const path = require('path');

// Caminho para o diretório de controllers
const controllersDir = path.join(__dirname, 'src', 'controllers');

// Verificar se o diretório existe
if (!fs.existsSync(controllersDir)) {
  console.error(`Diretório de controllers não encontrado: ${controllersDir}`);
  process.exit(1);
}

// Ler todos os arquivos no diretório de controllers
fs.readdir(controllersDir, (err, files) => {
  if (err) {
    console.error(`Erro ao ler diretório: ${err}`);
    process.exit(1);
  }

  // Filtrar apenas arquivos JavaScript
  const jsFiles = files.filter(file => file.endsWith('.js'));

  console.log(`\n===== VERIFICANDO ${jsFiles.length} CONTROLLERS =====\n`);

  // Verificar cada arquivo de controller
  jsFiles.forEach(file => {
    try {
      const controllerPath = path.join(controllersDir, file);
      const controller = require(controllerPath);

      console.log(`\nVerificando: ${file}`);
      
      // Verificar se o controller exporta um objeto
      if (typeof controller !== 'object') {
        console.error(`  ❌ Controller não exporta um objeto: ${file}`);
        return;
      }

      // Verificar cada método exportado pelo controller
      let hasIssues = false;
      for (const [methodName, method] of Object.entries(controller)) {
        if (typeof method !== 'function') {
          console.error(`  ❌ Método '${methodName}' não é uma função, é um ${typeof method}`);
          console.error(`      Valor: ${JSON.stringify(method).substring(0, 100)}...`);
          hasIssues = true;
        } else {
          console.log(`  ✅ Método '${methodName}' é uma função`);
        }
      }

      if (!hasIssues) {
        console.log(`  ✅ Controller '${file}' parece correto`);
      }
    } catch (error) {
      console.error(`  ❌ Erro ao avaliar controller ${file}: ${error.message}`);
    }
  });
});