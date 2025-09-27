import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { questionAnswers, mcpContent } from "./question-answers";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getCache } from "./cache";

// DON'T DELETE THIS COMMENT - Blueprint: javascript_gemini integration
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Use Gemini 2.5 Pro which excels at coding and multilingual tasks
const GEMINI_MODEL = "gemini-2.5-pro";

const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  context_type: z.enum(["strategic", "practical", "finnish", "planning", "technical", "mcp", "tech_lead", "general"]).default("general")
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all cases
  app.get("/api/cases", async (req, res) => {
    try {
      const cases = await storage.getAllCases();
      res.json(cases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cases" });
    }
  });

  // Get case by ID
  app.get("/api/cases/:id", async (req, res) => {
    try {
      const case_ = await storage.getCaseById(req.params.id);
      if (!case_) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.json(case_);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch case" });
    }
  });

  // Get question answer with AI enhancement - NEW STRUCTURE!
  app.get("/api/questions/:questionId/answer", async (req, res) => {
    try {
      const { questionId } = req.params;
      const enhance = req.query.enhance === 'true';
      
      // Check if answer exists in our question bank
      const questionAnswer = questionAnswers[questionId];
      if (!questionAnswer) {
        return res.status(404).json({ error: "Question not found" });
      }

      let finalAnswer = questionAnswer.answer;

      // Enhance with AI if requested
      if (enhance) {
        try {
          // Clean text to prevent encoding issues
          const cleanContent = questionAnswer.answer
            .replace(/[^\x00-\x7F]/g, (char) => {
              // Replace common Unicode characters with ASCII equivalents
              const replacements: Record<string, string> = {
                "\u2013": "-", // en dash
                "\u2014": "-", // em dash  
                "\u2018": "'", // left single quotation mark
                "\u2019": "'", // right single quotation mark
                "\u201C": '"', // left double quotation mark
                "\u201D": '"', // right double quotation mark
                "\u2026": "...",// horizontal ellipsis
              };
              return replacements[char] || char;
            });

          const enhancementResponse = await gemini.models.generateContent({
            model: GEMINI_MODEL, // using Gemini 2.5 Pro for enhanced responses
            config: {
              systemInstruction: `Toimit asiantuntijana, joka auttaa Humm group Oy:ta ottamaan tekoäly käyttöön organisaatiossa. sinulta kysytään paljon asiakaspalvelu-alasta ja tehtäväsi on vastata täsmällisesti kysymyksiin, käyttäen dataa, joka sinulle on annettu, mutta myös omaa tietoasi. Olet proaktiivinen. Käyttäjäsi ovat asiakaspalvelualan ammattilaisia, mutta tekoälystä eillä on vain perusymmärrys. Yritä saada heissä "wau" efekti aikaan, kun vastaat kysymyksiin, anna aina lähdeviittaukset mukaan, jos mahdollista`,
              maxOutputTokens: 300,
              temperature: 0.7
            },
            contents: `kysy fiksuja jatkokysymyksiä aiheesta. anna lähdeviittaukset pyydettäessä:\n\n${cleanContent}`
          });

          if (enhancementResponse.text) {
            finalAnswer = enhancementResponse.text;
          }
        } catch (aiError) {
          console.error("AI enhancement failed:", aiError);
          // Fall back to original answer if AI enhancement fails
        }
      }
      
      return res.json({ 
        answer: finalAnswer,
        enhanced: enhance && finalAnswer !== questionAnswer.answer
      });
    } catch (error) {
      console.error("Question answer error:", error);
      res.status(500).json({ error: "Failed to fetch answer" });
    }
  });

  // Get MCP content
  app.get("/api/mcp/content", async (req, res) => {
    try {
      res.json(mcpContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MCP content" });
    }
  });

  // Get category summary
  app.get("/api/categories/:category/summary", async (req, res) => {
    try {
      const { category } = req.params;
      const cases = await storage.getAllCases();
      const trends = await storage.getAllTrends();
      
      let summary = "";
      
      // Finnish AI Trends Categories
      if (category === "autonomous-agents") {
        const agentTrends = trends.filter(t => t.category === "autonomous_agents");
        summary = "🤖 **Autonomiset AI-agentit tehostavat asiakaspalvelua**\n\n" +
          "• AI-agentit tulevat tavanomaisiksi osaksi asiakaspalvelua\n" +
          "• Integroituvat asiakasviestintaalustoihin hoitamaan yksinkertaisia kyselyitä\n" +
          "• Lyhentävät jonotusaikoja ja mahdollistavat hyperpersoonoidun tuen\n" +
          "• Monista kuluttajista tulee AI-kanavan 'natiiveja'\n\n" +
          "💡 Yrityksillä ilman toimivaa AI-palvelukanavaa on riski asiakasuskollisuuden heikkenemiseen.";
      } else if (category === "ai-investments") {
        summary = "💰 **AI-investointien tuotto-odotukset kypsyvät**\n\n" +
          "• 49% AI-johtajista odottaa tuloksia 1-3 vuodessa\n" +
          "• 44% odottaa tuloksia 3-5 vuodessa\n" +
          "• Hype on laantumassa ja johtajat painottavat realistisempia mittareita\n" +
          "• Ennakoiva AI tulee takaisin generatiivisen AI:n rinnalle\n\n" +
          "⚠️ Jopa 30% AI-projekteista saatetaan hylätä huonon datan tai kustannusten vuoksi.";
      } else if (category === "hyperpersonalization") {
        summary = "🎯 **Hyperpersoonallistaminen ja datan laatu**\n\n" +
          "• Generatiivinen AI ja monimodaaliset mallit mahdollistavat yksilöllisen vuorovaikutuksen\n" +
          "• Analysoidaan ostotietoja, selaushistoriaa ja tunnesävyä\n" +
          "• Palvelut ovat entistä henkilökohtaisempia ja tehokkaampia\n" +
          "• Datan laatu on kriittinen menestyksen edellytys\n\n" +
          "📊 AI ei pysty tarjoamaan täyttä asiakasymmärrystä, jos data on hajaantuneena eri järjestelmiin.";
      } else if (category === "proactive-service") {
        summary = "🔮 **Proaktiivinen kanavien yli ulottuva palvelu**\n\n" +
          "• Siirtyminen reaktiivisesta proaktiiviseen asiakkaan ilahduttamiseen\n" +
          "• AI yhdistää eri järjestelmiä tarjoamaan ajantasaista apua\n" +
          "• Reaaliaikainen kanavien välinen näkyvyys mahdollistaa sentimentin ymmärtämisen\n" +
          "• Esim. lentoyhtiöt rebookaavat lennot automaattisesti\n\n" +
          "🎪 Intentional channel strategies ovat välttämättömiä menestymiselle.";
      }
      
      // Case Study Categories
      else if (category === "finnish-cases") {
        const finnishCases = cases.filter(c => c.country === "Suomi" || c.country === "Suomi/Pohjoismaat");
        summary = "🇫🇮 **Suomalaiset AI-asiakaspalvelutoteutukset**\n\n" +
          finnishCases.map(c => 
            `**${c.company}** (${c.industry})\n` +
            `${c.description}\n` +
            `${Array.isArray(c.key_metrics) ? c.key_metrics.map((m: any) => `• ${m.label}: ${m.value}`).join('\n') : ''}\n`
          ).join('\n') +
          "\n🌟 Suomalaiset yritykset ovat ottaneet AI:n hyvin käyttöön asiakaspalvelussa.";
      } else if (category === "international-cases") {
        const intlCases = cases.filter(c => c.country !== "Suomi" && c.country !== "Suomi/Pohjoismaat");
        summary = "🌍 **Kansainväliset AI-toteutukset**\n\n" +
          intlCases.slice(0, 4).map(c => 
            `**${c.company}** (${c.country}, ${c.industry})\n` +
            `${c.description}\n` +
            `${Array.isArray(c.key_metrics) ? c.key_metrics.map((m: any) => `• ${m.label}: ${m.value}`).join('\n') : ''}\n`
          ).join('\n') +
          "\n🚀 Globaalit johtajat näyttävät tietä AI-asiakaspalvelussa.";
      } else if (category === "by-industry") {
        const industries = Array.from(new Set(cases.map(c => c.industry)));
        summary = "🏭 **AI-toteutukset toimialoittain**\n\n" +
          industries.map(industry => {
            const industryCases = cases.filter(c => c.industry === industry);
            return `**${industry}**: ${industryCases.length} toteutusta\n` +
              industryCases.slice(0, 2).map(c => `• ${c.company}: ${c.solution_name}`).join('\n');
          }).join('\n\n') +
          "\n\n📈 AI soveltuu monille eri toimialoille.";
      }
      
      if (!summary) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category summary" });
    }
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context_type } = chatRequestSchema.parse(req.body);
      console.log("Received message:", message, "Context:", context_type);

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '') {
        return res.status(200).json({
          response: 'Anteeksi, AI-avustaja ei ole tällä hetkellä käytettävissä. Tämä on demo-versio jossa tarvitaan Gemini API-avain toimiakseen. Voit tarkastella case-esimerkkejä sivun vasemmasta reunasta.'
        });
      }

      // Get data from cache
      const { cases, trends, attachedAssetsContent } = await getCache();

      const normalizeText = (text: string) => {
        return text
          .replace(/[^\x00-\x7F]/g, (char) => {
            const replacements: Record<string, string> = {
              "\u2013": "-", "\u2014": "-", "\u2018": "'", "\u2019": "'",
              "\u201C": '"', "\u201D": '"', "\u2026": "...", "\u00A0": " ",
              "\u202F": " ", "ä": "ä", "ö": "ö", "å": "å", "Ä": "Ä",
              "Ö": "Ö", "Å": "Å"
            };
            return replacements[char] || "";
          })
          .replace(/\s+/g, ' ').trim();
      };

      const getContextualFallback = (message: string): string[] => {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('mcp') || lowerMessage.includes('protocol')) return ["Mitkä ovat MCP:n suurimmat riskit?", "Millä aikataululla MCP voidaan toteuttaa?"];
        if (lowerMessage.includes('roi') || lowerMessage.includes('kustannus')) return ["Miten mittaamme AI-investoinnin onnistumista?", "Millä resursseilla toteutus vaatii?"];
        if (lowerMessage.includes('hyperpersonointi')) return ["Mikä on hyperpersonoinnin toteutuskustannus?", "Mitä teknologiaa hyperpersonointi vaatii?"];
        if (lowerMessage.includes('proaktiivinen')) return ["Miten proaktiivisuus vaikuttaa asiakastyytyväisyyteen?", "Millaisia resursseja proaktiivinen palvelu vaatii?"];
        if (lowerMessage.includes('integraatio')) return ["Mitä riskejä järjestelmäintegraatiossa on?", "Millä aikataululla integraatio voidaan toteuttaa?"];
        return ["Mikä on AI-toteutuksen takaisinmaksuaika?", "Mitä riskejä AI-käyttöönotossa tulee huomioida?"];
      };

      const jsonInstruction = `
          **TÄRKEÄÄ**: Vastaa AINA JSON-muodossa. Vastauksesi tulee olla objekti, jossa on kaksi avainta:
          1.  "response": Merkkijono, joka sisältää Markdown-muotoillun vastauksesi käyttäjän kysymykseen.
          2.  "followUpSuggestions": Taulukko, joka sisältää 2-3 relevanttia suomenkielistä jatkokysymystä.

          Esimerkki JSON-muodosta:
          \`\`\`json
          {
            "response": "Tässä on vastaus kysymykseesi...",
            "followUpSuggestions": [
              "Mikä on investoinnin takaisinmaksuaika?",
              "Mitä riskejä toteutuksessa on?"
            ]
          }
          \`\`\`
      `;

      let systemPrompt = "";
      // Create content based on context type
      if (context_type === "strategic") {
        const strategicTrends = trends.filter(t => ["autonomous_agents", "ai_investments", "hyperpersonalization", "proactive_service", "human_ai_collaboration", "business_impact"].includes(t.category));
        const trendsContent = strategicTrends.map(t => `${normalizeText(t.title)}: ${normalizeText(t.description)} - ${Array.isArray(t.key_points) ? (t.key_points as string[]).map(p => normalizeText(p)).join("; ") : ""}`).join("\n\n");
        systemPrompt = `${attachedAssetsContent}VAROITUS: MCP = Model Context Protocol. ÄLÄ KOSKAAN tarkoita Microsoft Certified Professional tai muuta.\n\nOlet AI-asiantuntija joka auttaa humm.fi-tiimiä ymmärtämään 2025 AI-trendejä.\n\n2025 AI-trendit: ${trendsContent}\n\n**Vastaa aina suomeksi.** Jos kysytään MCP:stä, selitä Model Context Protocol. Keskity strategisiin näkökulmiin. ${jsonInstruction}`;
      } else if (context_type === "practical") {
        const compactCases = cases.map(c => `${normalizeText(c.company)} (${normalizeText(c.country)}, ${normalizeText(c.industry)}): ${Array.isArray(c.key_metrics) ? c.key_metrics.map((m: any) => `${m.label}: ${m.value}`).join(", ") : ""}. ${normalizeText(c.full_text.substring(0, 300))}...`).join('\n\n');
        systemPrompt = `${attachedAssetsContent}You are an AI expert helping humm.fi team understand practical AI implementations.\n\nYou have 6 proven case studies:\n\n${compactCases}\n\nAlways respond in Finnish and focus on practical, actionable steps. ${jsonInstruction}`;
      } else if (context_type === "finnish") {
        const finnishCases = cases.filter(c => c.country === "Suomi" || c.country === "Suomi/Pohjoismaat");
        const otherCases = cases.filter(c => c.country !== "Suomi" && c.country !== "Suomi/Pohjoismaat");
        const finnishContent = finnishCases.map(c => `${normalizeText(c.company)}: ${normalizeText(c.description)} - Tulokset: ${Array.isArray(c.key_metrics) ? c.key_metrics.map((m: any) => `${m.label}: ${m.value}`).join(", ") : ""}`).join("\n\n");
        const globalContent = otherCases.map(c => `${normalizeText(c.company)} (${normalizeText(c.country)}): ${normalizeText(c.description.substring(0, 150))}...`).join("\n\n");
        systemPrompt = `${attachedAssetsContent}Olet AI-asiantuntija joka auttaa humm.fi:tä ymmärtämään AI-toteutuksia erityisesti Suomen markkinoille.\n\n## Suomalaiset esimerkit:\n${finnishContent}\n\n## Kansainväliset vertailukohteet:\n${globalContent}\n\n**Vastaa aina suomeksi** ja Suomi-keskeisesti. ${jsonInstruction}`;
      } else if (context_type === "mcp") {
        systemPrompt = `${attachedAssetsContent}You are an AI expert explaining Model Context Protocol to humm.fi team.\n\nCRITICAL: MCP stands for Model Context Protocol. MCP enables Role-based access control, explicit context boundaries, audit trails, real-time integration, and multi-step processes.\n\nIMPORTANT: Always end MCP-related responses with information about industry developments.\n\nRespond in Finnish using Markdown formatting. Focus on strategic benefits. ${jsonInstruction}`;
      } else if (context_type === "tech_lead") {
        const techLeadProfile = `PANU MURTOKANGAS - TECH LEAD HAKEMUS...`; // Abridged for brevity
        systemPrompt = `${attachedAssetsContent}Olet Panu Murtokangas, Tech Lead -hakija Humm Group Oy:lle. Vastaat kysymyksiin CV:stäsi ja osaamisestasi.\n\n${techLeadProfile}\n\n**Vastaa aina suomeksi** ja pysy roolissasi. ${jsonInstruction}`;
      } else if (context_type === "planning") {
        const planningTrends = trends.filter(t => t.category === "automation" || t.category === "strategic");
        const trendsContent = planningTrends.map(t => `${normalizeText(t.title)}: ${Array.isArray(t.key_points) ? (t.key_points as string[]).slice(0, 2).map(p => normalizeText(p)).join("; ") : ""}`).join("\n\n");
        const keyLearnings = cases.map(c => `${normalizeText(c.company)}: ${Array.isArray(c.learning_points) ? c.learning_points.map(p => normalizeText(p)).slice(0, 2).join("; ") : ""}`).join("\n\n");
        const mcpKnowledge = `MCP (Model Context Protocol) on avoin standardi...`; // Abridged
        systemPrompt = `${attachedAssetsContent}Olet AI-strategiaavustaja joka auttaa humm.fi:tä suunnittelemaan seuraavia askelia.\n\n**TÄRKEÄ SÄÄNTÖ:** MCP tarkoittaa AINA Model Context Protocol.\n\n## Model Context Protocol (MCP) - MÄÄRITELMÄ:\n${mcpKnowledge}\n\n## 2025 Trendit:\n${trendsContent}\n\n## Tärkeimmät opit tapauksista:\n${keyLearnings}\n\n**Vastaa aina suomeksi** ja strategisesti. ${jsonInstruction}`;
      } else { // general
        const topTrends = trends.slice(0, 2).map(t => `${normalizeText(t.title)}: ${normalizeText(t.description)}`).join("\n\n");
        const topCases = cases.slice(0, 3).map(c => `${normalizeText(c.company)}: ${normalizeText(c.description)}`).join("\n\n");
        systemPrompt = `${attachedAssetsContent}Olet AI-asiantuntija joka auttaa humm.fi-tiimiä.\n\n## Tärkeimmät trendit:\n${topTrends}\n\n## Esimerkkitapaukset:\n${topCases}\n\n**Vastaa aina suomeksi** ja anna konkreettisia, hyödyllisiä tietoja. ${jsonInstruction}`;
      }

      let response;
      try {
        console.log(`Making optimized Gemini API call with model: ${GEMINI_MODEL}, message length: ${normalizeText(message).length}`);
        response = await gemini.models.generateContent({
          model: GEMINI_MODEL,
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 2000,
            temperature: 0.8,
            responseMimeType: "application/json",
          },
          contents: normalizeText(message)
        });
        console.log("Gemini response candidates:", response.candidates?.length, "finish reason:", response.candidates?.[0]?.finishReason);
      } catch (error: any) {
        console.error("Gemini request failed:", error.name, error.message, error.stack);
        return res.status(200).json({
          response: 'Anteeksi, tapahtui virhe AI-avustajassa. Yritä uudelleen hetken päästä.',
          followUpSuggestions: []
        });
      }

      const rawResponse = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text;
      let aiResponse = "Anteeksi, en pystynyt käsittelemään kysymystäsi.";
      let followUpSuggestions: string[] = [];

      try {
        if (!rawResponse) throw new Error("Received empty response from Gemini.");
        const parsedResponse = JSON.parse(rawResponse);
        aiResponse = parsedResponse.response || aiResponse;
        followUpSuggestions = parsedResponse.followUpSuggestions || getContextualFallback(message);
      } catch (parseError) {
        console.error("Failed to parse Gemini JSON response:", parseError, "Raw response:", rawResponse);
        aiResponse = rawResponse; // Fallback to raw text if JSON parsing fails
        followUpSuggestions = getContextualFallback(message);
      }

      await storage.saveChatMessage({ message, response: aiResponse, timestamp: Date.now() });

      res.json({
        response: aiResponse,
        followUpSuggestions: followUpSuggestions.filter(s => s.length > 5)
      });

    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Get chat history
  app.get("/api/chat/history", async (req, res) => {
    try {
      const history = await storage.getChatHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  // Case implementation details endpoint
  app.post('/api/cases/:id/implementation', async (req, res) => {
    try {
      const caseId = req.params.id;
      console.log(`Generating implementation details for case ID: ${caseId}`);

      // Get case data
      const cases = await storage.getAllCases();
      const targetCase = cases.find(c => c.id.toString() === caseId);
      
      if (!targetCase) {
        return res.status(404).json({ error: 'Case not found' });
      }

      // Generate detailed implementation content using Gemini
      const prompt = `Luo yksityiskohtainen, syvyysanalyysi ${targetCase.company}:n AI-asiakaspalvelutoteutuksesta. Sisällytä:

CASE: ${targetCase.company} - ${targetCase.solution_name}
TOIMIALA: ${targetCase.industry}
KUVAUS: ${targetCase.description}
KATEGORIA: ${targetCase.category}

Luo seuraava sisältö **suomeksi**:

## 1. Tekninen toteutus
- Käytetyt AI-teknologiat ja -mallit
- Järjestelmäarkkitehtuuri
- Integraatiot olemassa oleviin järjestelmiin
- Käyttöliittymäratkaisut

## 2. Projektin vaiheet ja aikataulu
- Pilottivaihe ja sen kesto
- Asteittainen käyttöönotto
- Koulutus ja muutoksen hallinta
- Tuotantokäyttöön siirtyminen

## 3. Kustannukset ja ROI
- Alkuinvestointi (teknologia, henkilöstö, koulutus)
- Operatiiviset kustannukset
- Säästöt henkilöstökustannuksissa
- Asiakastyytyväisyyden parantuminen
- Takaisinmaksuaika

## 4. Haasteet ja oppimiskohteet
- Teknologiset haasteet ja ratkaisut
- Organisaation muutosvastarinta
- Datan laatu ja saatavuus
- Asiakkaiden vastaanotto

## 5. Tulokset ja mittarit
- Konkreettiset hyödyt (säästöt, tehokkuus)
- Asiakaskokemuksen parantuminen
- Henkilöstön työn muuttuminen
- Pitkän aikavälin vaikutukset

## 6. Oppimiskohteet Humm Group Oy:lle
- Sovellettavat käytännöt
- Kriittiset menestystekijät
- Varoitukset ja riskientenhallinta
- Strategiset suositukset

Keskity käytännöllisiin, mitattaviin tuloksiin ja konkreettisiin oppimiskohtiin joita Humm Group Oy voi hyödyntää omassa AI-strategiassaan.`;

      // Define normalizeText function for this endpoint
      const normalizeText = (text: string) => {
        return text
          .replace(/[^\x00-\x7F]/g, (char) => {
            const replacements: Record<string, string> = {
              "\u2013": "-",
              "\u2014": "-",  
              "\u2018": "'",
              "\u2019": "'",
              "\u201C": '"',
              "\u201D": '"',
              "\u2026": "...",
              "\u00A0": " ",
              "\u202F": " ",
              "ä": "ä", "ö": "ö", "å": "å",
              "Ä": "Ä", "Ö": "Ö", "Å": "Å"
            };
            return replacements[char] || "";
          })
          .replace(/\s+/g, ' ')
          .trim();
      };

      const normalizedPrompt = normalizeText(prompt);

      // Generate content using Gemini API
      const result = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        config: {
          systemInstruction: `Toimit asiantuntijana, joka auttaa Humm Group Oy:ta ottamaan tekoäly käyttöön organisaatiossa. Keskity käytännöllisiin, mitattaviin tuloksiin ja konkreettisiin oppimiskohtiin joita Humm Group Oy voi hyödyntää omassa AI-strategiassaan.`
        },
        contents: normalizedPrompt
      });
      
      let generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || 
        "Sisällön luomisessa tapahtui virhe. Yritä uudelleen myöhemmin.";

      // Clean up the response
      generatedText = normalizeText(generatedText);

      console.log(`Generated implementation details for ${targetCase.company}: ${generatedText.substring(0, 200)}...`);

      res.json({ 
        content: generatedText,
        company: targetCase.company,
        solution: targetCase.solution_name
      });

    } catch (error) {
      console.error('Error generating implementation details:', error);
      res.status(500).json({ 
        error: 'Failed to generate implementation details',
        content: `# ${req.params.id ? 'Toteutuksen yksityiskohdat' : 'Tekninen virhe'}

Pahoittelemme, mutta yksityiskohtaisen toteutusanalyysin luomisessa tapahtui virhe. 

## Yleisiä AI-toteutuksen vaiheita:

### 1. Suunnittelu ja strategia
- Liiketoimintatarpeiden kartoitus
- Teknologiavalintojen tekeminen
- Projektisuunnitelman laatiminen

### 2. Pilotointi
- Rajoitettu kokeilu
- Alkuperäisten tulosten mittaaminen
- Tarvittavat säädöt

### 3. Laajennus
- Asteittainen käyttöönotto
- Henkilöstön koulutus
- Prosessien optimointi

### 4. Tuotantokäyttö
- Täysi implementaatio
- Jatkuva seuranta ja parantaminen
- ROI:n mittaaminen

Yritä uudelleen tai ota yhteyttä tekniseen tukeen.`
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
