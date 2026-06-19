import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale, BookOpen, CheckCircle, ArrowRight, HelpCircle, RotateCcw,
  Award, Calculator, Sparkles, ChevronRight, Info, AlertCircle,
  ThumbsUp, RefreshCw, TrendingUp, Zap, Target, Crown
} from 'lucide-react';

// ------------------------------------------------------------
// UTILITÁRIOS & HOOKs
// ------------------------------------------------------------

// Hook seguro para localStorage
function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(stored));
    } catch (e) {
      // Ignora erros (ex: modo privado)
    }
  }, [key, stored]);

  return [stored, setStored];
}

// Parser melhorado para a calculadora
function parseTermos(expr) {
  const clean = expr.replace(/\s+/g, '');
  const withSigns = clean.replace(/(?<=^|[-+])-/g, '+-');
  const termos = withSigns.split(/(?=[+-])/).filter(t => t !== '');
  let xCoeff = 0, constant = 0;

  termos.forEach(termo => {
    if (termo.includes('x')) {
      let val = termo.replace('x', '');
      if (val === '' || val === '+') val = '1';
      if (val === '-') val = '-1';
      xCoeff += parseFloat(val);
    } else {
      constant += parseFloat(termo);
    }
  });

  return { xCoeff, constant };
}

function resolverEquacao(equacao) {
  const eq = equacao.replace(/\s+/g, '');
  if (!eq.includes('=')) throw new Error("Precisa do sinal '='");
  const [esquerdo, direito] = eq.split('=');
  if (esquerdo === '' || direito === '') throw new Error("Ambos os lados devem ter expressões.");

  const left = parseTermos(esquerdo);
  const right = parseTermos(direito);

  const A = left.xCoeff - right.xCoeff;
  const B = left.constant - right.constant;

  if (A === 0) {
    if (B === 0) throw new Error("Infinitas soluções (identidade).");
    throw new Error("Equação impossível (sem solução).");
  }

  const x = -B / A;
  return { x: Number(x.toFixed(2)), A, B, left, right };
}

// ------------------------------------------------------------
// DADOS
// ------------------------------------------------------------

const EXEMPLOS_TEORIA = [
  {
    titulo: "O que é uma equação?",
    equacao: "x + 3 = 8",
    passos: [
      { expressao: "x + 3 = 8", explicacao: "Temos um número desconhecido 'x' que, somado a 3, resulta em 8." },
      { expressao: "x + 3 - 3 = 8 - 3", explicacao: "Subtraímos 3 de ambos os lados para manter o equilíbrio." },
      { expressao: "x = 5", explicacao: "Pronto! Descobrimos que o valor de x é 5." }
    ]
  },
  {
    titulo: "Equação com Multiplicação",
    equacao: "3x = 12",
    passos: [
      { expressao: "3x = 12", explicacao: "O x está a ser multiplicado por 3." },
      { expressao: "3x / 3 = 12 / 3", explicacao: "Dividimos ambos os lados por 3 para anular a multiplicação." },
      { expressao: "x = 4", explicacao: "O valor de x é 4." }
    ]
  },
  {
    titulo: "Equação em Duas Etapas",
    equacao: "2x + 5 = 17",
    passos: [
      { expressao: "2x + 5 = 17", explicacao: "Eliminar o termo independente (+5)." },
      { expressao: "2x = 17 - 5", explicacao: "Passamos o 5 para o outro lado subtraindo." },
      { expressao: "2x = 12", explicacao: "Simplificamos." },
      { expressao: "x = 12 / 2", explicacao: "Dividimos ambos os lados por 2." },
      { expressao: "x = 6", explicacao: "Excelente! O valor de x é 6." }
    ]
  }
];

const CENARIOS_BALANCA = [
  { id: 1, label: "x + 3 = 7", leftX: 1, leftNum: 3, rightX: 0, rightNum: 7, xReal: 4 },
  { id: 2, label: "2x + 1 = 9", leftX: 2, leftNum: 1, rightX: 0, rightNum: 9, xReal: 4 },
  { id: 3, label: "3x + 2 = x + 8", leftX: 3, leftNum: 2, rightX: 1, rightNum: 8, xReal: 3 }
];

// ------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------------------------------------

export default function App() {
  const [activeTab, setActiveTab] = useState('teoria');
  const [pontos, setPontos] = useLocalStorage('eq_lab_pontos', 0);
  const [conquistas, setConquistas] = useLocalStorage('eq_lab_conquistas', []);
  const [visitasTeoria, setVisitasTeoria] = useLocalStorage('eq_lab_visitas_teoria', 0);
  const [usoCalculadora, setUsoCalculadora] = useLocalStorage('eq_lab_uso_calc', 0);

  const adicionarConquista = useCallback((nome) => {
    if (!conquistas.includes(nome)) {
      setConquistas(prev => [...prev, nome]);
    }
  }, [conquistas, setConquistas]);

  useEffect(() => {
    if (activeTab === 'teoria') {
      setVisitasTeoria(prev => prev + 1);
      if (visitasTeoria + 1 >= 3) adicionarConquista("Teórico");
    }
  }, [activeTab, setVisitasTeoria, visitasTeoria, adicionarConquista]);

  useEffect(() => {
    if (activeTab === 'calculadora' && usoCalculadora >= 5) {
      adicionarConquista("Calculista Pro");
    }
  }, [activeTab, usoCalculadora, adicionarConquista]);

  const handleCorrectAnswer = useCallback((pontosGanhos) => {
    setPontos(prev => prev + pontosGanhos);
    adicionarConquista("Desbravador Algébrico");
  }, [setPontos, adicionarConquista]);

  const handleWinBalanca = useCallback(() => {
    setPontos(prev => prev + 50);
    adicionarConquista("Mestre do Equilíbrio");
  }, [setPontos, adicionarConquista]);

  const reiniciarProgresso = () => {
    if (window.confirm("Tens a certeza que queres apagar todo o teu progresso?")) {
      setPontos(0);
      setConquistas([]);
      setVisitasTeoria(0);
      setUsoCalculadora(0);
      try {
        localStorage.removeItem('eq_lab_pontos');
        localStorage.removeItem('eq_lab_conquistas');
        localStorage.removeItem('eq_lab_visitas_teoria');
        localStorage.removeItem('eq_lab_uso_calc');
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <header className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-md py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg" aria-hidden="true">
              <Scale className="h-7 w-7 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Laboratório da Equação</h1>
              <p className="text-xs text-indigo-100">Domina o Primeiro Grau de Forma Visual</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="bg-indigo-800/50 px-4 py-1.5 rounded-full border border-indigo-500/30 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-yellow-300 fill-yellow-300" aria-hidden="true" />
              <span>{pontos} Pontos</span>
            </div>
            {conquistas.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5 bg-violet-800/50 px-3 py-1.5 rounded-full border border-violet-500/30 text-xs">
                <Award className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <span>{conquistas.length} Conquista(s)</span>
              </div>
            )}
            <button
              onClick={reiniciarProgresso}
              className="text-xs text-indigo-200 hover:text-white underline-offset-2 hover:underline"
              aria-label="Reiniciar progresso"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 py-2 shadow-sm" role="tablist">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap gap-2 justify-center">
          {[
            { id: 'teoria', label: '1. Teoria & Exemplos', icon: BookOpen },
            { id: 'balanca', label: '2. Laboratório da Balança', icon: Scale },
            { id: 'exercicios', label: '3. Desafio Prático', icon: CheckCircle },
            { id: 'calculadora', label: '4. Calculadora Passo a Passo', icon: Calculator }
          ].map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'teoria' && <TeoriaTab onNavigate={() => setActiveTab('balanca')} />}
        {activeTab === 'balanca' && <BalancaTab onWin={handleWinBalanca} />}
        {activeTab === 'exercicios' && <ExerciciosTab onCorrectAnswer={handleCorrectAnswer} />}
        {activeTab === 'calculadora' && <CalculadoraTab onUse={() => setUsoCalculadora(prev => prev + 1)} />}
      </main>

      <footer className="bg-slate-800 text-slate-400 py-6 text-center text-xs border-t border-slate-700 mt-auto">
        <p>© 2026 Laboratório de Matemática • Pratica e domina a álgebra de forma simples e intuitiva.</p>
        <p className="mt-1 text-slate-500">Desenvolvido em Português para promover a aprendizagem interativa.</p>
      </footer>
    </div>
  );
}

// ------------------------------------------------------------
// 1. TEORIA
// ------------------------------------------------------------
function TeoriaTab({ onNavigate }) {
  const [exemploAtivo, setExemploAtivo] = useState(0);
  const [passoAtual, setPassoAtual] = useState(0);
  const exemplo = EXEMPLOS_TEORIA[exemploAtivo];

  const mudarExemplo = useCallback((index) => {
    setExemploAtivo(index);
    setPassoAtual(0);
  }, []);

  return (
    <div className="grid md:grid-cols-12 gap-6 max-w-5xl mx-auto">
      <div className="md:col-span-7 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2 text-indigo-600">
            <BookOpen className="h-5 w-5" aria-hidden="true" /> De Expressões para Equações
          </h2>
          <p className="text-slate-600 mb-4 leading-relaxed text-sm">
            Nas <strong>expressões algébricas</strong>, tu apenas organizavas termos como <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono font-semibold">2x + 5</code>. Não dava para saber quanto valia o <var>x</var> porque não havia igualdade nem resultado.
          </p>
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg mb-4">
            <h3 className="font-semibold text-indigo-900 text-sm mb-1">A Grande Diferença: O sinal de IGUAL (=)</h3>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Ao adicionar uma igualdade, como <code className="font-mono">2x + 5 = 11</code>, criamos uma <strong>Equação</strong>. O sinal de igual funciona como um compromisso de equilíbrio total: o prato esquerdo pesa o mesmo que o prato direito.
            </p>
          </div>
          <p className="text-slate-600 leading-relaxed text-sm">
            Isso significa que existe apenas <strong>um único valor misterioso para o <var>x</var></strong> que torna a igualdade verdadeira. O teu objetivo é sempre <strong>Isolar o X</strong> (deixá-lo sozinho num dos lados da igualdade).
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" /> As Duas Regras de Ouro
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0" aria-hidden="true">1</span>
              <p className="text-slate-600 text-sm"><strong>O que fizeres de um lado, faz do outro:</strong> Se adicionares 5g no prato esquerdo, deves adicionar também 5g no direito.</p>
            </div>
            <div className="flex gap-3">
              <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0" aria-hidden="true">2</span>
              <p className="text-slate-600 text-sm"><strong>Operações Inversas:</strong> Ao mudares um número de lado, ele faz a operação inversa. Somar vira subtrair, multiplicar vira dividir.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-5 space-y-6">
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col justify-between h-full min-h-[400px]">
          <div>
            <span className="text-[10px] font-semibold text-indigo-400 tracking-wider uppercase">Demonstração Interativa</span>
            <div className="flex gap-1 mt-3 mb-5 border-b border-slate-800 pb-2 overflow-x-auto" role="tablist">
              {EXEMPLOS_TEORIA.map((ex, idx) => (
                <button
                  key={idx}
                  role="tab"
                  aria-selected={exemploAtivo === idx}
                  onClick={() => mudarExemplo(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    exemploAtivo === idx ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Exemplo {idx + 1}
                </button>
              ))}
            </div>
            <h3 className="text-base font-bold text-white mb-2">{exemplo.titulo}</h3>
            <div className="bg-slate-950 rounded-xl p-4 my-4 border border-slate-800/85 text-center">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Passo Atual ({passoAtual + 1} de {exemplo.passos.length})</span>
              <div className="text-xl font-mono font-bold tracking-wider text-emerald-400 py-2">
                {exemplo.passos[passoAtual].expressao}
              </div>
            </div>
            <div className="bg-slate-800/90 border border-slate-700/50 p-4 rounded-xl text-xs leading-relaxed text-slate-300">
              {exemplo.passos[passoAtual].explicacao}
            </div>
          </div>
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => setPassoAtual(prev => Math.max(0, prev - 1))}
              disabled={passoAtual === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                passoAtual === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-800'
              }`}
              aria-label="Passo anterior"
            >
              Anterior
            </button>
            <div className="flex gap-1" aria-hidden="true">
              {exemplo.passos.map((_, idx) => (
                <span key={idx} className={`h-1.5 w-1.5 rounded-full transition-all ${idx === passoAtual ? 'bg-indigo-500 w-3' : 'bg-slate-700'}`} />
              ))}
            </div>
            {passoAtual < exemplo.passos.length - 1 ? (
              <button onClick={() => setPassoAtual(prev => prev + 1)} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 flex items-center gap-1.5">
                Seguinte <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </button>
            ) : (
              <button onClick={() => mudarExemplo((exemploAtivo + 1) % EXEMPLOS_TEORIA.length)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 flex items-center gap-1">
                Outro Exemplo <RotateCcw className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-12 flex justify-center mt-4">
        <button onClick={onNavigate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 hover:-translate-y-0.5 transition-all text-sm">
          Ir para o Laboratório Prático da Balança <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// 2. BALANÇA
// ------------------------------------------------------------
function BalancaTab({ onWin }) {
  const [cenarioAtivo, setCenarioAtivo] = useState(0);
  const [leftX, setLeftX] = useState(1);
  const [leftNum, setLeftNum] = useState(3);
  const [rightX, setRightX] = useState(0);
  const [rightNum, setRightNum] = useState(7);
  const [inputValue, setInputValue] = useState(1);
  const [logMensagens, setLogMensagens] = useState([]);
  const [statusResolvido, setStatusResolvido] = useState(false);

  const carregarCenario = useCallback((idx) => {
    const c = CENARIOS_BALANCA[idx];
    setCenarioAtivo(idx);
    setLeftX(c.leftX);
    setLeftNum(c.leftNum);
    setRightX(c.rightX);
    setRightNum(c.rightNum);
    setLogMensagens([`🔍 Enigma: ${c.label}. Deixa apenas 1x de um lado.`]);
    setStatusResolvido(false);
  }, []);

  useEffect(() => {
    carregarCenario(cenarioAtivo);
  }, [carregarCenario, cenarioAtivo]);

  const xRealValor = CENARIOS_BALANCA[cenarioAtivo].xReal;
  const pesoEsquerdo = leftX * xRealValor + leftNum;
  const pesoDireito = rightX * xRealValor + rightNum;
  const diferenca = pesoEsquerdo - pesoDireito;
  const estaEquilibrado = diferenca === 0;
  const anguloInclinacao = Math.max(-15, Math.min(15, diferenca * 1.8));

  useEffect(() => {
    if (estaEquilibrado && !statusResolvido) {
      const xIsolado = (leftX === 1 && leftNum === 0 && rightX === 0) ||
                       (rightX === 1 && rightNum === 0 && leftX === 0);
      if (xIsolado) {
        setStatusResolvido(true);
        onWin();
      }
    }
  }, [leftX, leftNum, rightX, rightNum, estaEquilibrado, statusResolvido, onWin]);

  const aplicarOperacao = useCallback((operacao, valor, lado) => {
    if (statusResolvido) return;
    const valNum = parseInt(valor) || 0;

    if (lado === 'ambos') {
      switch (operacao) {
        case 'somar':
          setLeftNum(p => p + valNum);
          setRightNum(p => p + valNum);
          setLogMensagens(p => [...p, `➕ Somado +${valNum} em ambos os lados.`]);
          break;
        case 'subtrair':
          setLeftNum(p => Math.max(0, p - valNum));
          setRightNum(p => Math.max(0, p - valNum));
          setLogMensagens(p => [...p, `➖ Subtraído -${valNum} em ambos os lados.`]);
          break;
        case 'subtrair_x':
          setLeftX(p => Math.max(0, p - valNum));
          setRightX(p => Math.max(0, p - valNum));
          setLogMensagens(p => [...p, `❌ Removido -${valNum}x em ambos os lados.`]);
          break;
        case 'dividir':
          if (valNum <= 0) return;
          setLeftX(p => p / valNum);
          setLeftNum(p => p / valNum);
          setRightX(p => p / valNum);
          setRightNum(p => p / valNum);
          setLogMensagens(p => [...p, `➗ Dividido ambos os lados por ${valNum}.`]);
          break;
        default: break;
      }
    } else {
      if (operacao === 'subtrair') {
        if (lado === 'esquerdo') setLeftNum(p => Math.max(0, p - valNum));
        if (lado === 'direito') setRightNum(p => Math.max(0, p - valNum));
        setLogMensagens(p => [...p, `⚠️ Retirado peso apenas da ${lado === 'esquerdo' ? 'esquerda' : 'direita'}! A balança desequilibrou.`]);
      }
    }
  }, [statusResolvido]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <Scale className="h-6 w-6 text-indigo-600" aria-hidden="true" /> Laboratório da Balança
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          O teu objetivo é isolar o <span className="text-emerald-600 font-bold">x</span>. Deixa apenas 1 caixinha verde num prato e limpa todos os números de lá.
        </p>
      </div>

      <div className="flex justify-center gap-2 flex-wrap">
        {CENARIOS_BALANCA.map((cen, idx) => (
          <button
            key={cen.id}
            onClick={() => carregarCenario(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              cenarioAtivo === idx ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200'
            }`}
            aria-pressed={cenarioAtivo === idx}
          >
            Enigma {idx + 1}: {cen.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center relative min-h-[420px]">
          {statusResolvido && (
            <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center p-6 text-center animate-fade-in rounded-2xl">
              <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <ThumbsUp className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Enigma Desvendado!</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-xs">
                Excelente! Isolaste o <var>x</var> perfeitamente. O valor de <var>x</var> é <strong>{leftX === 1 ? rightNum : leftNum}</strong>.
              </p>
              {cenarioAtivo < CENARIOS_BALANCA.length - 1 ? (
                <button onClick={() => carregarCenario(cenarioAtivo + 1)} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1">
                  Próximo Enigma <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </button>
              ) : (
                <p className="text-xs text-indigo-600 font-bold mt-4">🎉 Parabéns! Completaste todos os desafios!</p>
              )}
            </div>
          )}

          {!estaEquilibrado && !statusResolvido && (
            <div className="w-full bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 text-rose-600" aria-hidden="true" />
                <span>Balança desequilibrada! Clica para repor o peso original.</span>
              </div>
              <button onClick={() => carregarCenario(cenarioAtivo)} className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-colors" aria-label="Reiniciar balança">
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Reiniciar
              </button>
            </div>
          )}

          {estaEquilibrado && !statusResolvido && (
            <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" aria-hidden="true"></span> Balança em Equilíbrio
            </div>
          )}

          <svg viewBox="0 0 500 300" className="w-full max-w-[380px] h-auto mt-2" role="img" aria-label="Balança de dois pratos">
            <path d="M 230 260 L 270 260 L 250 130 Z" fill="#475569" />
            <rect x="190" y="260" width="120" height="10" rx="3" fill="#334155" />
            <circle cx="250" cy="130" r="6" fill="#1e293b" />
            <g transform={`rotate(${anguloInclinacao} 250 130)`} className="transition-transform duration-300 ease-out">
              <rect x="80" y="127" width="340" height="6" rx="2" fill="#64748b" />
              <g transform="translate(100, 130)">
                <line x1="0" y1="0" x2="-30" y2="70" stroke="#94a3b8" strokeWidth="1.5" />
                <line x1="0" y1="0" x2="30" y2="70" stroke="#94a3b8" strokeWidth="1.5" />
                <path d="M -45 70 Q 0 85 45 70 Z" fill="#d97706" />
                <g transform="translate(0, 55)">
                  {Array.from({ length: Math.min(5, leftX) }).map((_, i) => (
                    <rect key={`lx-${i}`} x={(i-Math.min(5,leftX)/2)*16 + 8} y={-10} width="14" height="14" rx="2" fill="#10b981" />
                  ))}
                  {Array.from({ length: Math.min(8, leftNum) }).map((_, i) => (
                    <circle key={`ln-${i}`} cx={(i-Math.min(8,leftNum)/2)*10 + 5} cy={10} r="4" fill="#f59e0b" />
                  ))}
                </g>
              </g>
              <g transform="translate(400, 130)">
                <line x1="0" y1="0" x2="-30" y2="70" stroke="#94a3b8" strokeWidth="1.5" />
                <line x1="0" y1="0" x2="30" y2="70" stroke="#94a3b8" strokeWidth="1.5" />
                <path d="M -45 70 Q 0 85 45 70 Z" fill="#d97706" />
                <g transform="translate(0, 55)">
                  {Array.from({ length: Math.min(5, rightX) }).map((_, i) => (
                    <rect key={`rx-${i}`} x={(i-Math.min(5,rightX)/2)*16 + 8} y={-10} width="14" height="14" rx="2" fill="#10b981" />
                  ))}
                  {Array.from({ length: Math.min(8, rightNum) }).map((_, i) => (
                    <circle key={`rn-${i}`} cx={(i-Math.min(8,rightNum)/2)*10 + 5} cy={10} r="4" fill="#f59e0b" />
                  ))}
                </g>
              </g>
            </g>
          </svg>

          <div className="mt-4 flex items-center justify-between gap-6 w-full max-w-xs bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-sm font-bold text-center">
            <div className="text-emerald-800 w-1/3">
              {leftX > 0 && `${leftX === 1 ? '' : leftX}x`}{leftX > 0 && leftNum > 0 && ' + '}{leftNum > 0 && leftNum}{leftX===0 && leftNum===0 && '0'}
            </div>
            <div className="text-indigo-600 text-lg">=</div>
            <div className="text-emerald-800 w-1/3">
              {rightX > 0 && `${rightX === 1 ? '' : rightX}x`}{rightX > 0 && rightNum > 0 && ' + '}{rightNum > 0 && rightNum}{rightX===0 && rightNum===0 && '0'}
            </div>
          </div>
        </div>

        <div className="md:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2">Painel de Comandos</h3>
            <div>
              <label htmlFor="pesoInput" className="block text-[11px] font-bold text-slate-500 mb-1">Escolha a quantidade/peso:</label>
              <input id="pesoInput" type="number" min="1" max="10" value={inputValue} onChange={(e) => setInputValue(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label="Valor da operação" />
            </div>
            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold text-emerald-600">Ações em AMBOS os lados (Mantém Reto)</span>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => aplicarOperacao('somar', inputValue, 'ambos')} disabled={!estaEquilibrado || statusResolvido} className="bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold border border-slate-200 disabled:opacity-40">Somar +{inputValue}</button>
                <button onClick={() => aplicarOperacao('subtrair', inputValue, 'ambos')} disabled={!estaEquilibrado || statusResolvido} className="bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold border border-slate-200 disabled:opacity-40">Subtrair -{inputValue}</button>
                <button onClick={() => aplicarOperacao('subtrair_x', inputValue, 'ambos')} disabled={!estaEquilibrado || statusResolvido} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-lg text-xs font-bold border border-emerald-200 col-span-2 disabled:opacity-40">Remover -{inputValue}x</button>
                <button onClick={() => aplicarOperacao('dividir', inputValue, 'ambos')} disabled={!estaEquilibrado || statusResolvido || inputValue <= 1} className="bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold border border-slate-200 col-span-2 disabled:opacity-40">Dividir tudo por {inputValue}</button>
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="block text-[11px] font-bold text-rose-500">Ação ERRADA (Apenas num lado)</span>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => aplicarOperacao('subtrair', inputValue, 'esquerdo')} disabled={!estaEquilibrado || statusResolvido} className="bg-rose-50/50 hover:bg-rose-50 text-rose-700 py-1.5 rounded-lg text-[11px] font-medium border border-rose-100 disabled:opacity-40">Tirar só da esquerda</button>
                <button onClick={() => aplicarOperacao('subtrair', inputValue, 'direito')} disabled={!estaEquilibrado || statusResolvido} className="bg-rose-50/50 hover:bg-rose-50 text-rose-700 py-1.5 rounded-lg text-[11px] font-medium border border-rose-100 disabled:opacity-40">Tirar só da direita</button>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-[11px] min-h-[100px] flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 font-sans">Histórico Técnico:</span>
              {logMensagens.slice(-3).map((m, i) => <div key={i} className="text-slate-300">➔ {m}</div>)}
            </div>
            <button onClick={() => carregarCenario(cenarioAtivo)} className="mt-3 text-right text-indigo-400 font-bold hover:underline flex items-center gap-1 self-end font-sans text-xs" aria-label="Reiniciar cenário">
              <RefreshCw className="h-3 w-3" aria-hidden="true" /> Reiniciar tudo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// 3. EXERCÍCIOS
// ------------------------------------------------------------
function ExerciciosTab({ onCorrectAnswer }) {
  const [level, setLevel] = useState(1);
  const [exercise, setExercise] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [dicaAtiva, setDicaAtiva] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);

  const gerarExercicio = useCallback((lvl) => {
    let equacao = "", solucao = 0, dica = "";
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 12) + 1;
    const x = Math.floor(Math.random() * 6) + 2;

    switch(lvl) {
      case 1:
        solucao = x;
        equacao = `x + ${b} = ${x + b}`;
        dica = `Subtrai ${b} de ambos os lados: x = ${x + b} - ${b}.`;
        break;
      case 2:
        solucao = x;
        equacao = `${a}x = ${a * x}`;
        dica = `Divide ambos os lados por ${a}: x = ${a * x} / ${a}.`;
        break;
      case 3:
        solucao = x;
        equacao = `${a}x + ${b} = ${a * x + b}`;
        dica = `Passa ${b} para a direita a subtrair: ${a}x = ${a * x + b} - ${b}. Depois divide por ${a}.`;
        break;
      case 4:
        const c_coeff = Math.floor(Math.random() * 3) + 1;
        const a_coeff = c_coeff + Math.floor(Math.random() * 3) + 1;
        solucao = x;
        const b_val = Math.floor(Math.random() * 5) + 2;
        const d_val = (a_coeff - c_coeff) * x + b_val;
        equacao = `${a_coeff}x + ${b_val} = ${c_coeff}x + ${d_val}`;
        dica = `Subtrai ${c_coeff}x de ambos: ${a_coeff - c_coeff}x + ${b_val} = ${d_val}. Depois subtrai ${b_val} e divide.`;
        break;
      default: break;
    }

    setExercise({ equacao, solucao, dica });
    setUserAnswer('');
    setFeedback(null);
    setDicaAtiva(false);
  }, []);

  useEffect(() => {
    gerarExercicio(level);
  }, [level, gerarExercicio]);

  const checarResposta = useCallback(() => {
    if (!exercise) return;
    const ans = parseFloat(userAnswer);
    if (isNaN(ans)) {
      setFeedback({ success: false, msg: "Introduz um número válido." });
      return;
    }
    if (ans === exercise.solucao) {
      setFeedback({ success: true, msg: "Excelente! Acertaste em cheio!" });
      setStreak(prev => prev + 1);
      setAcertos(prev => prev + 1);
      const pontosGanhos = 10 + (streak * 2);
      onCorrectAnswer(pontosGanhos);
    } else {
      setFeedback({ success: false, msg: "Quase lá! Tenta ver a dica se precisares." });
      setStreak(0);
      setErros(prev => prev + 1);
    }
  }, [exercise, userAnswer, streak, onCorrectAnswer]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-600" aria-hidden="true" />
          <h3 className="font-bold text-slate-800">Nível de dificuldade:</h3>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {[1, 2, 3, 4].map((lvl) => (
            <button key={lvl} onClick={() => setLevel(lvl)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${level === lvl ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} aria-pressed={level === lvl}>
              Nível {lvl} {lvl === 1 ? "(Básico)" : lvl === 2 ? "(Mult.)" : lvl === 3 ? "(2 etapas)" : "(Var. ambos)"}
            </button>
          ))}
        </div>
      </div>

      {exercise && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-lg mx-auto text-center space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Encontra o Valor de X</span>
            <div className="text-4xl font-mono font-extrabold text-slate-800 py-3 tracking-wide">{exercise.equacao}</div>
          </div>
          <div className="max-w-xs mx-auto space-y-3">
            <input type="number" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="Insere o valor..." onKeyDown={(e) => e.key === 'Enter' && checarResposta()} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-mono font-bold text-center focus:outline-none focus:border-indigo-500" aria-label="Resposta" />
            <button onClick={checarResposta} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all">Confirmar Resposta</button>
          </div>
          <div className="flex justify-center gap-6 text-xs text-slate-600">
            <span>✅ Acertos: {acertos}</span>
            <span>❌ Erros: {erros}</span>
            {streak > 0 && <span className="text-amber-600 font-bold">🔥 Sequência: {streak}</span>}
          </div>
          {feedback && (
            <div className={`p-4 rounded-xl text-sm font-semibold max-w-sm mx-auto flex flex-col items-center gap-2 border ${feedback.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
              <p>{feedback.msg}</p>
              {feedback.success ? (
                <button onClick={() => gerarExercicio(level)} className="text-xs text-indigo-600 underline font-bold mt-1">Próxima Equação ➔</button>
              ) : (
                <button onClick={() => setDicaAtiva(true)} className="text-xs text-rose-600 font-bold underline mt-1">Ver Dica de Resolução</button>
              )}
            </div>
          )}
          {dicaAtiva && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left max-w-sm mx-auto">
              <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" /> Dica de Apoio:</p>
              <p className="text-xs text-amber-700 leading-relaxed font-medium">{exercise.dica}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// 4. CALCULADORA PASSO A PASSO
// ------------------------------------------------------------
function CalculadoraTab({ onUse }) {
  const [equacaoInput, setEquacaoInput] = useState('2x + 4 = 10');
  const [passosSolucao, setPassosSolucao] = useState([]);
  const [erro, setErro] = useState('');

  const resolver = useCallback(() => {
    setErro('');
    setPassosSolucao([]);
    onUse();

    try {
      const eq = equacaoInput.trim();
      const { x, A, B, left, right } = resolverEquacao(eq);

      const passos = [];
      const [esq, dir] = eq.split('=').map(s => s.trim());
      passos.push({ titulo: "Equação original", expressao: `${esq} = ${dir}`, detalhe: "Vamos isolar o x aplicando operações inversas." });

      if (right.xCoeff !== 0) {
        passos.push({
          titulo: "Mover termos com x para a esquerda",
          expressao: `${left.xCoeff - right.xCoeff}x + ${left.constant} = ${right.constant}`,
          detalhe: `Subtraímos ${right.xCoeff}x de ambos os lados.`
        });
      }

      const novoA = left.xCoeff - right.xCoeff;
      const novoB = left.constant - right.constant;
      if (novoB !== 0) {
        passos.push({
          titulo: "Mover constantes para a direita",
          expressao: `${novoA}x = ${-novoB}`,
          detalhe: `Subtraímos ${novoB} de ambos os lados (ou somamos ${-novoB}).`
        });
      }

      if (novoA !== 1) {
        passos.push({
          titulo: "Dividir ambos os lados",
          expressao: `x = ${(-novoB) / novoA}`,
          detalhe: `Dividimos por ${novoA} para isolar x.`
        });
      } else {
        passos.push({ titulo: "Resultado", expressao: `x = ${-novoB}`, detalhe: "O x já está isolado." });
      }

      passos.push({ titulo: "Solução final", expressao: `x = ${x}`, detalhe: `A solução da equação é ${x}.` });
      setPassosSolucao(passos);
    } catch (err) {
      setErro(err.message);
    }
  }, [equacaoInput, onUse]);

  return (
    <div className="grid md:grid-cols-12 gap-6 max-w-5xl mx-auto">
      <div className="md:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-indigo-600" aria-hidden="true" /> Detalhar Resolução
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">Digita qualquer equação do primeiro grau para visualizar os passos.</p>
        <div className="space-y-2">
          <label htmlFor="equacaoInput" className="block text-xs font-bold text-slate-600 uppercase">Escreve a Equação:</label>
          <input id="equacaoInput" type="text" value={equacaoInput} onChange={(e) => setEquacaoInput(e.target.value)} placeholder="Ex: 3x - 5 = 10" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-mono text-lg font-bold text-slate-700 focus:outline-none focus:border-indigo-500" aria-describedby="calcHelp" />
        </div>
        <button onClick={resolver} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm">
          Resolver Passo a Passo <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        {erro && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs text-rose-700 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
            <p className="font-semibold">{erro}</p>
          </div>
        )}
        <div className="bg-indigo-50 p-4 rounded-xl text-xs space-y-2 text-indigo-900" id="calcHelp">
          <h4 className="font-bold flex items-center gap-1"><Info className="h-3.5 w-3.5" aria-hidden="true" /> Experimenta estes exemplos:</h4>
          <ul className="list-disc pl-4 space-y-1 font-mono">
            <li><button onClick={() => setEquacaoInput('3x - 5 = 10')} className="hover:underline text-indigo-700">3x - 5 = 10</button></li>
            <li><button onClick={() => setEquacaoInput('5x + 3 = 2x + 12')} className="hover:underline text-indigo-700">5x + 3 = 2x + 12</button></li>
            <li><button onClick={() => setEquacaoInput('4x = 24')} className="hover:underline text-indigo-700">4x = 24</button></li>
            <li><button onClick={() => setEquacaoInput('-2x + 5 = 3x - 7')} className="hover:underline text-indigo-700">-2x + 5 = 3x - 7</button></li>
          </ul>
        </div>
      </div>

      <div className="md:col-span-7 bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col justify-start min-h-[420px]">
        <div className="mb-4">
          <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">Caminho Matemático</span>
          <h3 className="text-lg font-bold text-white mt-1">Explicação das Etapas</h3>
        </div>
        {passosSolucao.length > 0 ? (
          <div className="space-y-4 overflow-y-auto max-h-[380px] pr-2">
            {passosSolucao.map((passo, idx) => (
              <div key={idx} className={`p-4 rounded-xl border transition-all ${idx === passosSolucao.length - 1 ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Passo {idx}</span>
                  <span className="text-xs font-semibold text-indigo-400">{passo.titulo}</span>
                </div>
                <div className="text-lg font-mono font-bold tracking-wider py-1 border-b border-slate-800 mb-2">{passo.expressao}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{passo.detalhe}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <Calculator className="h-10 w-10 text-slate-600" aria-hidden="true" />
            <p className="text-sm">Insere uma equação e clica em resolver para ver as operações inversas em ação!</p>
          </div>
        )}
      </div>
    </div>
  );
}
