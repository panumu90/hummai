import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CaseCard } from "@/components/case-card";
import { ChatInterface } from "@/components/chat-interface";
import { TechLeadModal } from "@/components/tech-lead-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bot, Building, Users, BarChart } from "lucide-react";
import type { Case } from "@/lib/types";


export default function Home() {
  const { data: cases, isLoading, error } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });
  const [techLeadModalOpen, setTechLeadModalOpen] = useState(false);

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-bold text-foreground">Virhe</h1>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Casien lataaminen epäonnistui. Tarkista verkkoyhteys ja yritä uudelleen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-white font-sans min-h-screen flex flex-col">
      {/* Netflix-style Header */}
      <header className="bg-slate-900/90 border-b border-slate-700/50 sticky top-0 z-50 backdrop-blur-md flex-shrink-0 animate-in fade-in-0 duration-700">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="flex items-center space-x-3 lg:space-x-4 animate-in slide-in-from-left-4 duration-500">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
                  <Bot className="text-white h-4 w-4 lg:h-5 lg:w-5" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-white animate-in slide-in-from-left-2 duration-600 delay-100" data-testid="header-title">humm.fi</h1>
                  <p className="text-xs lg:text-sm text-slate-300 animate-in slide-in-from-left-2 duration-600 delay-200">AI Asiakaspalvelu Showcase</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 lg:space-x-6 animate-in slide-in-from-right-4 duration-500 delay-300">
              <div className="text-xs lg:text-sm text-slate-300 flex items-center space-x-2">
                <Building className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Sisäinen käyttö</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Netflix-style Split Layout */}
      <div className="flex flex-col lg:flex-row min-h-0 flex-1">
        {/* Left Panel - AI Assistant (35%) */}
        <div className="w-full lg:w-[35%] bg-slate-800/50 lg:border-r border-slate-700/50 flex flex-col min-h-0 backdrop-blur-sm animate-in slide-in-from-left-6 duration-700 delay-400">
          <div className="px-4 sm:px-6 lg:px-6 py-4 lg:py-5 border-b border-slate-700/50">
            <div className="flex items-center space-x-3 mb-2 animate-in fade-in-0 duration-600 delay-500">
              <Bot className="h-5 w-5 lg:h-6 lg:w-6 text-blue-400 animate-pulse" />
              <h2 className="text-lg lg:text-xl font-bold text-white">AI Assistentti</h2>
            </div>
            <p className="text-slate-300 text-xs lg:text-sm animate-in fade-in-0 duration-600 delay-600">
              🤖 Räätälöidyt vastaukset johdolle
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden animate-in fade-in-0 duration-800 delay-700">
            <ChatInterface />
          </div>
        </div>

        {/* Right Panel - Case Explorer (65%) */}
        <div className="w-full lg:w-[65%] bg-slate-900/30 flex flex-col min-h-0 border-t lg:border-t-0 border-slate-700/50 animate-in slide-in-from-right-6 duration-700 delay-500">
          <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6 bg-slate-800/40 border-b border-slate-700/50 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
              <div className="animate-in fade-in-0 duration-600 delay-600">
                <h2 className="text-lg lg:text-xl font-bold text-white">🎯 Onnistuneet AI-caset</h2>
                <p className="text-slate-300 text-xs lg:text-sm mt-1">Asiakaspalvelussa parannettu kokemus ja tehokkuus</p>
              </div>
              <div className="flex items-center space-x-2 lg:space-x-4 animate-in slide-in-from-right-4 duration-600 delay-700">
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-xs lg:text-sm border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 text-slate-200 hover:text-white px-2 lg:px-3 transition-all duration-200 hover:scale-105"
                  onClick={() => setTechLeadModalOpen(true)}
                  data-testid="tech-lead-cta"
                >
                  <Users className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  Tech Lead
                </Button>
                <Link href="/impact-analysis">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-xs lg:text-sm border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 text-slate-200 hover:text-white px-2 lg:px-3 transition-all duration-200 hover:scale-105"
                    data-testid="impact-analysis-cta-top"
                  >
                    <BarChart className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                    Vaikutusanalyysi
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Case Content Area - Netflix style */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 lg:space-y-6 bg-gradient-to-b from-slate-900/40 to-slate-900/60">
          {/* Case Cards Grid - Netflix Style */}
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-slate-800/30 border border-slate-600/50 hover:border-slate-500/50 hover:bg-slate-800/50 transition-all duration-300 backdrop-blur-sm" data-testid={`skeleton-card-${i}`}>
                  <CardContent className="p-6 animate-in fade-in-0 duration-300" style={{ animationDelay: `${i * 150}ms` }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-12 h-12 rounded-lg bg-slate-700/50" />
                        <div>
                          <Skeleton className="h-6 w-32 mb-2 bg-slate-700/50" />
                          <Skeleton className="h-4 w-24 bg-slate-700/50" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full bg-slate-700/50" />
                    </div>
                    <div className="mb-4">
                      <Skeleton className="h-4 w-40 mb-2 bg-slate-700/50" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full bg-slate-700/50" />
                        <Skeleton className="h-4 w-3/4 bg-slate-700/50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="text-center p-3">
                          <Skeleton className="h-6 w-12 mx-auto mb-1 rounded bg-slate-700/50" />
                          <Skeleton className="h-3 w-16 mx-auto rounded bg-slate-700/50" />
                        </div>
                      ))}
                    </div>
                    <div className="mb-4">
                      <Skeleton className="h-4 w-32 mb-2 bg-slate-700/50" />
                      <div className="space-y-1">
                        {[...Array(3)].map((_, k) => (
                          <Skeleton key={k} className="h-3 w-full bg-slate-700/50" />
                        ))}
                      </div>
                    </div>
                    <Skeleton className="h-10 w-full rounded bg-slate-700/50" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cases?.length ? (
            <div className="space-y-6" data-testid="cases-grid">
              {cases.map((case_, index) => (
                <div
                  key={case_.id}
                  className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 hover:scale-[1.02] transition-transform"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CaseCard case_={case_} />
                </div>
              ))}
            </div>
          ) : (
            <Card data-testid="no-cases" className="bg-slate-800/30 border border-slate-600/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Ei caseja saatavilla</h3>
                <p className="text-slate-300">
                  Caseja ei löytynyt tai ne ovat väliaikaisesti poissa käytöstä.
                </p>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </div>

      {/* Tech Lead Modal */}
      <TechLeadModal 
        isOpen={techLeadModalOpen} 
        onClose={() => setTechLeadModalOpen(false)} 
      />
    </div>
  );
}
