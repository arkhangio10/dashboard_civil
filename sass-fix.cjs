// sass-fix.js
// Este script resuelve problemas comunes con la configuración de Sass en proyectos React/Vite

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Rutas principales
const packageJsonPath = path.join(process.cwd(), 'package.json');
const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
const variablesScssPath = path.join(process.cwd(), 'src', 'assets', 'styles', 'variables.scss');
const globalScssPath = path.join(process.cwd(), 'src', 'assets', 'styles', 'global.scss');

console.log('🔍 Iniciando diagnóstico de problemas de Sass...');

// Verificar versión de Sass
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const sassVersion = packageJson.dependencies.sass || packageJson.devDependencies.sass;
  
  console.log(`✓ Versión de Sass encontrada: ${sassVersion}`);
  
  // Comprobar si hay problemas conocidos con esta versión
  if (sassVersion.includes('1.88.0')) {
    console.log('⚠️ La versión 1.88.0 de Sass tiene problemas conocidos de compatibilidad con algunos proyectos.');
    console.log('💡 Recomendación: Actualizar a la versión 1.69.5 (la última versión estable conocida)');
    
    // Preguntar si desea actualizar
    console.log('\n🔄 Actualizando Sass a la versión 1.69.5...');
    try {
      execSync('npm install sass@1.69.5 --save', { stdio: 'inherit' });
      console.log('✅ Sass actualizado correctamente a la versión 1.69.5');
    } catch (e) {
      console.error('❌ Error al actualizar Sass:', e.message);
      console.log('Por favor ejecuta manualmente: npm install sass@1.69.5 --save');
    }
  }
} catch (e) {
  console.error('❌ Error al leer package.json:', e.message);
}

// Verificar y corregir configuración de Vite
try {
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Verificar si ya tiene configuración de Sass
  if (!viteConfig.includes('preprocessorOptions') || !viteConfig.includes('scss')) {
    console.log('⚠️ La configuración de Vite no incluye la configuración adecuada para Sass.');
    
    // Crear una nueva configuración corregida
    const correctedConfig = `// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // No usar additionalData si usa @import en los archivos SCSS
      }
    }
  }
})`;
    
    fs.writeFileSync(viteConfigPath, correctedConfig, 'utf8');
    console.log('✅ Configuración de Vite actualizada correctamente');
  } else {
    // Si ya tiene configuración, verificar si usa additionalData
    if (viteConfig.includes('additionalData')) {
      console.log('⚠️ Se detectó el uso de additionalData en la configuración de Sass.');
      console.log('💡 Esto puede causar problemas con las importaciones. Eliminando esta configuración...');
      
      // Quitar la configuración de additionalData
      viteConfig = viteConfig.replace(/additionalData:.*?`.*?`/s, '// additionalData eliminado para evitar conflictos');
      fs.writeFileSync(viteConfigPath, viteConfig, 'utf8');
      console.log('✅ Configuración de additionalData eliminada correctamente');
    }
  }
} catch (e) {
  console.error('❌ Error al manipular vite.config.ts:', e.message);
}

// Verificar el archivo global.scss para asegurar que importa variables.scss correctamente
try {
  if (fs.existsSync(globalScssPath)) {
    let globalScss = fs.readFileSync(globalScssPath, 'utf8');
    
    // Verificar si ya importa variables.scss
    if (!globalScss.includes('@import') || !globalScss.includes('variables')) {
      console.log('⚠️ El archivo global.scss no importa correctamente variables.scss');
      
      // Agregar la importación al inicio del archivo
      globalScss = `/* Importar variables globales */
@import './variables.scss';

${globalScss}`;
      
      fs.writeFileSync(globalScssPath, globalScss, 'utf8');
      console.log('✅ Se agregó la importación de variables.scss al archivo global.scss');
    }
  }
} catch (e) {
  console.error('❌ Error al manipular global.scss:', e.message);
}

// Verificar el archivo variables.scss
try {
  if (fs.existsSync(variablesScssPath)) {
    let variablesScss = fs.readFileSync(variablesScssPath, 'utf8');
    
    // Asegurarse de que no contiene la directiva @import
    if (variablesScss.includes('@import')) {
      console.log('⚠️ El archivo variables.scss contiene directivas @import que podrían causar conflictos');
      
      // Extraer los imports
      const importRegex = /@import\s+['"]([^'"]+)['"]\s*;/g;
      const imports = [];
      let match;
      
      while ((match = importRegex.exec(variablesScss)) !== null) {
        imports.push(match[0]);
      }
      
      // Quitar los imports del archivo de variables
      for (const importStr of imports) {
        variablesScss = variablesScss.replace(importStr, `/* ${importStr} (movido a global.scss) */`);
      }
      
      fs.writeFileSync(variablesScssPath, variablesScss, 'utf8');
      console.log('✅ Las directivas @import fueron comentadas en variables.scss');
      
      // Agregar estos imports al archivo global.scss
      if (imports.length > 0 && fs.existsSync(globalScssPath)) {
        let globalScss = fs.readFileSync(globalScssPath, 'utf8');
        const importSection = `/* Imports movidos desde variables.scss */
${imports.join('\n')}

`;
        
        globalScss = importSection + globalScss;
        fs.writeFileSync(globalScssPath, globalScss, 'utf8');
        console.log('✅ Los imports se movieron correctamente a global.scss');
      }
    }
  }
} catch (e) {
  console.error('❌ Error al manipular variables.scss:', e.message);
}

console.log('\n🎉 Diagnóstico y corrección completados. Por favor, intenta ejecutar el proyecto nuevamente.');
console.log('Comando para ejecutar: npm run dev');
console.log('\nSi el problema persiste, considera estos pasos adicionales:');
console.log('1. Eliminar node_modules y el archivo package-lock.json');
console.log('2. Ejecutar npm install');
console.log('3. Ejecutar npm run dev');