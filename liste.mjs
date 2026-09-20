import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// 0. VÉRIFIER ET INSTALLER 'GLOB' SILENCIEUSEMENT
// =====================================================
let globInstalled = false;

console.log('🔍 Vérification de la présence de "glob"...');

try {
    // Tenter d'importer glob
    await import('glob');
    globInstalled = true;
    console.log('✅ "glob" est déjà installé');
} catch (error) {
    console.log('📦 "glob" n\'est pas installé - Installation automatique en cours...');
    
    try {
        // Installation silencieuse avec affichage des étapes
        console.log('⏳ Installation de "glob" via npm...');
        execSync('npm install glob', { 
            stdio: 'inherit',  // Affiche la progression dans le terminal
            encoding: 'utf-8'
        });
        console.log('✅ "glob" installé avec succès !');
        globInstalled = true;
        
        // Réimporter après installation
        const globModule = await import('glob');
        const { glob } = globModule;
        globFn = glob;
        
    } catch (installError) {
        console.error('❌ Erreur lors de l\'installation automatique de "glob" :', installError.message);
        console.log('💡 Utilisation de la version sans "glob" (fonctionnalités limitées)');
        globInstalled = false;
    }
}

// =====================================================
// 1. IMPORTER GLOB (SI INSTALLÉ) OU UTILISER FS PUR
// =====================================================
let globFn = null;
if (globInstalled) {
    try {
        const globModule = await import('glob');
        globFn = globModule.glob;
        console.log('✅ "glob" chargé avec succès');
    } catch (e) {
        console.log('⚠️  Erreur d\'import de glob, utilisation de fs pur');
        globFn = null;
    }
}

// =====================================================
// 2. CONFIGURATION
// =====================================================
const rootDir = '.';
const exclusions = ['node_modules', 'dist', 'public', 'nhost', '.vscode', '.nuxt', '.output', '.git', '.bolt', '.next'];
let outputFile = 'project_structure.txt';

// Fichiers à exclure à la racine
const rootFileExclusions = ['.md', '.txt', '.sql'];
const excludedFolders = ['docs'];

console.log('📂 Analyse de la structure du projet...');

// =====================================================
// 3. SUPPRIMER LES ANCIENS FICHIERS DE STRUCTURE
// =====================================================
if (globFn) {
    // Avec glob
    const oldStructureFiles = globFn.sync('project_structure*.txt', { cwd: rootDir });
    if (oldStructureFiles.length > 0) {
        console.log(`🧹 Suppression de ${oldStructureFiles.length} ancien(s) fichier(s) de structure...`);
        oldStructureFiles.forEach(file => {
            fs.unlinkSync(path.join(rootDir, file));
            console.log(`   ✅ Supprimé: ${file}`);
        });
    }
} else {
    // Sans glob
    try {
        const oldStructureFiles = fs.readdirSync(rootDir).filter(f => f.startsWith('project_structure') && f.endsWith('.txt'));
        if (oldStructureFiles.length > 0) {
            console.log(`🧹 Suppression de ${oldStructureFiles.length} ancien(s) fichier(s) de structure...`);
            oldStructureFiles.forEach(file => {
                fs.unlinkSync(path.join(rootDir, file));
                console.log(`   ✅ Supprimé: ${file}`);
            });
        }
    } catch (err) {
        // Ignorer les erreurs de lecture
    }
}

// =====================================================
// 4. FONCTIONS DE LISTAGE
// =====================================================

// Fonction pour vérifier si on doit exclure un fichier à la racine
function shouldExcludeRootFile(fileName, currentPath) {
    const isRoot = path.dirname(currentPath) === rootDir || path.dirname(currentPath) === '.';
    if (isRoot) {
        const ext = path.extname(fileName).toLowerCase();
        return rootFileExclusions.includes(ext);
    }
    return false;
}

// Version avec glob (plus rapide pour les grands projets)
function listDirWithGlob() {
    console.log('🔄 Génération de l\'arborescence avec glob...');
    
    const options = {
        cwd: rootDir,
        ignore: exclusions.map(e => `${e}/**`).concat(['project_structure*.txt']),
        nodir: false,
        dot: false
    };
    
    const files = globFn.sync('**/*', options);
    
    // Construire l'arborescence
    const tree = {};
    files.forEach(file => {
        const parts = file.split(path.sep);
        let current = tree;
        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                // C'est un fichier
                if (!current._files) current._files = [];
                current._files.push(part);
            } else {
                // C'est un dossier
                if (!current[part]) current[part] = {};
                current = current[part];
            }
        });
    });
    
    // Fonction pour afficher l'arborescence
    function printTree(obj, indent = '') {
        const keys = Object.keys(obj).filter(k => k !== '_files');
        const files = obj._files || [];
        
        // D'abord les dossiers
        keys.forEach((key, index) => {
            const isLast = index === keys.length - 1 && files.length === 0;
            const prefix = isLast ? '└── ' : '├── ';
            fs.appendFileSync(outputFile, `${indent}${prefix}📁 ${key}/\n`);
            const nextIndent = indent + (isLast ? '    ' : '│   ');
            printTree(obj[key], nextIndent);
        });
        
        // Puis les fichiers
        files.forEach((file, index) => {
            const isLast = index === files.length - 1;
            const prefix = isLast ? '└── ' : '├── ';
            fs.appendFileSync(outputFile, `${indent}${prefix}📄 ${file}\n`);
        });
    }
    
    fs.writeFileSync(outputFile, `Structure du projet (avec glob)\n================================\n\n`);
    printTree(tree);
    console.log(`✅ Structure du projet enregistrée dans "${outputFile}"`);
}

// Version sans glob (fs pur)
function listDirFs(dir, indent = '') {
    let items = [];
    try {
        items = fs.readdirSync(dir);
    } catch (err) {
        return;
    }

    for (const item of items) {
        const fullPath = path.join(dir, item);
        let isDirectory = false;
        try {
            isDirectory = fs.statSync(fullPath).isDirectory();
        } catch (err) {
            continue;
        }

        if (isDirectory && excludedFolders.includes(item)) continue;
        if (exclusions.includes(item)) continue;
        if (!isDirectory && shouldExcludeRootFile(item, fullPath)) continue;

        fs.appendFileSync(outputFile, `${indent}${isDirectory ? '📁' : '📄'} ${item}\n`);

        if (isDirectory) {
            listDirFs(fullPath, indent + '  ');
        }
    }
}

// =====================================================
// 5. EXÉCUTER LE LISTAGE
// =====================================================

// Incrémenter le nom du fichier si nécessaire
let counter = 1;
let baseOutputFile = outputFile;
while (fs.existsSync(outputFile)) {
    outputFile = `project_structure_${counter++}.txt`;
}

if (globFn) {
    listDirWithGlob();
} else {
    console.log('🔄 Génération de l\'arborescence avec fs (sans glob)...');
    fs.writeFileSync(outputFile, `Structure du projet (sans glob)\n================================\n\n`);
    listDirFs(rootDir);
    console.log(`✅ Structure du projet enregistrée dans "${outputFile}"`);
}

console.log(`📂 Fichier généré : ${outputFile}`);
console.log('✨ Terminé !');