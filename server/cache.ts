import { storage } from "./storage";
import { promises as fs } from 'fs';
import path from 'path';
import type { Case, Trend } from '../shared/types';

// Define the structure for our cached data
interface AppCache {
  attachedAssetsContent: string;
  cases: Case[];
  trends: Trend[];
}

// A singleton promise to ensure we only initialize once
let cachePromise: Promise<AppCache> | null = null;

const readAttachedAssets = async (): Promise<string> => {
  try {
    let pdfParse: any = null;
    try {
      const mod = await import('pdf-parse');
      pdfParse = (mod as any).default || (mod as any);
      if (typeof pdfParse !== 'function') {
        pdfParse = null;
        console.log("📋 PDF-parse not a valid function, skipping PDF files");
      }
    } catch (err) {
      console.log("📋 PDF-parse not available, skipping PDF files");
    }

    const assetsDir = path.join(process.cwd(), 'attached_assets');
    const files = await fs.readdir(assetsDir);
    const supportedFiles = files.filter(f =>
      f.endsWith('.txt') || f.endsWith('.md') || f.endsWith('.json') ||
      f.endsWith('.csv') || f.endsWith('.xml') || f.endsWith('.yaml') ||
      f.endsWith('.yml') || f.endsWith('.tsv') || (f.endsWith('.pdf') && pdfParse)
    );

    if (supportedFiles.length > 0) {
      console.log(`📁 Caching attached_assets: ${supportedFiles.length} files found (${supportedFiles.join(', ')})`);
      const contents = await Promise.all(
        supportedFiles.slice(0, 8).map(async f => {
          const filePath = path.join(assetsDir, f);
          let content = "";
          try {
            if (f.endsWith('.pdf') && pdfParse) {
              const buffer = await fs.readFile(filePath);
              const pdfData = await pdfParse(buffer);
              content = pdfData.text || "";
            } else {
              content = await fs.readFile(filePath, 'utf-8');
            }
          } catch (readError) {
            console.error(`❌ Failed to read ${f}:`, readError);
            content = `[Virhe luettaessa tiedostoa ${f}]`;
          }
          return `📋 **${f}**:\n${content.substring(0, 1500)}${content.length > 1500 ? '...' : ''}`;
        })
      );
      return `\n\n🎯 **ENSISIJAINEN TIETOLÄHDE - Käyttäjän lataamat tiedostot:**\n\n${contents.join('\n\n')}\n\n⚠️ **TÄRKEÄ OHJE**: Jos yllä olevista käyttäjän lataamista tiedostoista löytyy vastaus kysymykseen, käytä ENSISIJAISESTI näitä tietoja. Nämä ovat tuoreempia ja relevantimpia kuin alla olevat yleiset tiedot.\n\n---\n\n`;
    }
    return "";
  } catch (err) {
    console.log("📁 attached_assets directory not found or empty, skipping cache.");
    return "";
  }
};

const initializeCache = async (): Promise<AppCache> => {
  console.log("🚀 Initializing application cache...");
  const [attachedAssetsContent, cases, trends] = await Promise.all([
    readAttachedAssets(),
    storage.getAllCases(),
    storage.getAllTrends(),
  ]);

  console.log("✅ Cache initialized successfully.");
  return {
    attachedAssetsContent,
    cases,
    trends,
  };
};

export const getCache = (): Promise<AppCache> => {
  if (!cachePromise) {
    cachePromise = initializeCache();
  }
  return cachePromise;
};

// Also need to initialize the cache when the server starts.
// We can call getCache() in server/index.ts