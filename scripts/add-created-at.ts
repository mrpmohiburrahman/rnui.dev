/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// scripts/addCreatedAt.ts

// const fs = require("fs-extra")
// const path = require("path")

const {
  Expression,
  Project,
  SourceFile,
  SyntaxKind,
  VariableDeclaration,
} = require("ts-morph")

// Define the path to your data directory and the Entry module
const DATA_DIR = path.join(__dirname, "../data")
const ENTRY_FILE = path.join(DATA_DIR, "entry.ts")

// Initialize ts-morph project
const project = new Project({
  tsConfigFilePath: path.join(__dirname, "../tsconfig.json"),
  skipAddingFilesFromTsConfig: true,
})

// Add the Entry module to the project
const entrySourceFile = project.addSourceFileAtPath(ENTRY_FILE)

// Function to extract imported data files
function getImportedDataFiles(sourceFile: typeof SourceFile): string[] {
  const importDeclarations = sourceFile.getImportDeclarations()
  const dataFiles: string[] = []

  importDeclarations.forEach(
    (importDecl: { getModuleSpecifierValue: () => any }) => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue()
      // Adjust the regex if your import paths differ
      const match = moduleSpecifier.match(/^\.\/([\w-]+)$/)
      if (match) {
        const fileName = match[1]
        const filePath = path.join(DATA_DIR, `${fileName}.ts`)
        if (fs.existsSync(filePath)) {
          dataFiles.push(filePath)
        }
      }
    }
  )

  return dataFiles
}

// Get all imported data files
const dataFiles = getImportedDataFiles(entrySourceFile)

// Function to add or update "created_at" field
function addCreatedAtToDataFile(filePath: string) {
  const sourceFile = project.addSourceFileAtPath(filePath)

  // Assume the data is exported as a const array
  const exportedDeclarations = sourceFile.getExportedDeclarations()

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  exportedDeclarations.forEach((decls: any[], name: any) => {
    decls.forEach((decl) => {
      if (decl.getKind() === SyntaxKind.VariableDeclaration) {
        // Correct usage of asKindOrThrow without generics
        const varDecl = decl.asKindOrThrow(
          SyntaxKind.VariableDeclaration
        ) as typeof VariableDeclaration

        const initializer = varDecl.getInitializer()
        if (
          initializer &&
          initializer.getKind() === SyntaxKind.ArrayLiteralExpression
        ) {
          const arrayLiteral = initializer.asKindOrThrow(
            SyntaxKind.ArrayLiteralExpression
          )
          const elements = arrayLiteral.getElements()

          // Get current time
          let currentTime = new Date()

          elements.forEach((element: typeof Expression, index: number) => {
            if (element.getKind() === SyntaxKind.ObjectLiteralExpression) {
              const objLiteral = element.asKindOrThrow(
                SyntaxKind.ObjectLiteralExpression
              )

              // Check if "created_at" already exists
              const existing = objLiteral.getProperty("created_at")
              if (existing) {
                console.log(
                  `"created_at" already exists in entry ${index + 1} of ${path.basename(filePath)}. Skipping...`
                )
                return
              }

              // Create the "created_at" property
              const isoString = currentTime.toISOString()
              objLiteral.addPropertyAssignment({
                name: "created_at",
                initializer: `"${isoString}"`,
              })

              // Subtract one second for the next entry
              currentTime = new Date(currentTime.getTime() - 1000)
            }
          })
        }
      }
    })
  })

  // Save the modified source file
  sourceFile.saveSync()
  console.log(`Updated "created_at" in ${path.basename(filePath)}`)
}

// Process each data file
dataFiles.forEach((filePath) => {
  addCreatedAtToDataFile(filePath)
})

console.log("All data files have been processed.")
