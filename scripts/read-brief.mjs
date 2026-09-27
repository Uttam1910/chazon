import { getDocument } from '../.tools/node_modules/pdfjs-dist/legacy/build/pdf.mjs'
import { readFile } from 'node:fs/promises'
const pdf = await getDocument({ data: new Uint8Array(await readFile('Chazon Website Brief.pdf')), useSystemFonts: true }).promise
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i)
  const content = await page.getTextContent()
  console.log(`PAGE ${i}\n${content.items.map(x => x.str).join(' ')}`)
}
