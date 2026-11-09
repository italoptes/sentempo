import { useState } from 'react';
import type { PerguntaPendente, RespostaQuestionario } from '../servicos/estudo';

function Escala({ nome, pergunta, minimo, maximo, valor, aoMudar }: {
  nome: string; pergunta: string; minimo: string; maximo: string; valor: string; aoMudar: (valor: string) => void;
}) {
  return <fieldset className="space-y-3">
    <legend className="font-medium">{pergunta}</legend>
    <p className="text-sm text-texto-secundario">1 = {minimo} · 7 = {maximo}</p>
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5, 6, 7].map(n => <label key={n} className="min-h-12 min-w-12 border border-borda-controle rounded-lg flex items-center justify-center gap-2 px-2">
        <input type="radio" name={nome} value={n} checked={valor === String(n)} onChange={e => aoMudar(e.target.value)} />{n}
      </label>)}
    </div>
    <label className="min-h-12 flex items-center gap-3"><input type="radio" name={nome} value="pular" checked={valor === 'pular'} onChange={e => aoMudar(e.target.value)} />Prefiro não responder</label>
  </fieldset>;
}

export function QuestionarioEstudo({ pergunta, ocupado, aoConfirmar }: {
  pergunta: PerguntaPendente; ocupado: boolean; aoConfirmar: (resposta: RespostaQuestionario) => Promise<void>;
}) {
  const [confianca, definirConfianca] = useState('');
  const [agradabilidade, definirAgradabilidade] = useState('');
  const [ansiedade, definirAnsiedade] = useState('');
  const [estrategia, definirEstrategia] = useState('');
  const [comentario, definirComentario] = useState('');
  const numerico = (valor: string) => valor === 'pular' ? null : Number(valor);
  const completo = pergunta.tipo === 'TENTATIVA' ? !!confianca : pergunta.tipo === 'BLOCO' ? !!agradabilidade && !!ansiedade : !!estrategia;
  return <form className="bg-branco border border-destaque-claro rounded-2xl p-6 space-y-6" onSubmit={e => {
    e.preventDefault();
    if (!completo || ocupado) return;
    const resposta: RespostaQuestionario = { tipo: pergunta.tipo };
    if (pergunta.tipo === 'TENTATIVA') Object.assign(resposta, { tentativa_id: pergunta.tentativa_id, confianca: numerico(confianca) });
    else if (pergunta.tipo === 'BLOCO') Object.assign(resposta, { bloco: pergunta.bloco, agradabilidade: numerico(agradabilidade), ansiedade: numerico(ansiedade) });
    else Object.assign(resposta, { estrategia: estrategia === 'pular' ? null : estrategia, comentario: comentario.trim() || null });
    void aoConfirmar(resposta);
  }}>
    <h2 className="text-lg font-semibold">{pergunta.tipo === 'TENTATIVA' ? 'Sobre sua resposta' : pergunta.tipo === 'BLOCO' ? `Sobre o bloco ${pergunta.bloco}` : 'Sobre sua estratégia'}</h2>
    <p className="text-sm">As respostas são opcionais. Você pode selecionar “Prefiro não responder”.</p>
    <fieldset disabled={ocupado} className="space-y-6">
      {pergunta.tipo === 'TENTATIVA' ? <Escala nome="confianca" pergunta="Quão confiante você está de que finalizou próximo do tempo-alvo?" minimo="Nada confiante" maximo="Muito confiante" valor={confianca} aoMudar={definirConfianca} />
        : pergunta.tipo === 'BLOCO' ? <>
          <Escala nome="agradabilidade" pergunta="Quão agradável foi realizar este bloco?" minimo="Muito desagradável" maximo="Muito agradável" valor={agradabilidade} aoMudar={definirAgradabilidade} />
          <Escala nome="ansiedade" pergunta="Quanta ansiedade você sentiu durante este bloco?" minimo="Nenhuma" maximo="Muita" valor={ansiedade} aoMudar={definirAnsiedade} />
        </> : <>
          <fieldset className="space-y-2"><legend className="font-medium mb-3">Qual estratégia você utilizou na maior parte das tentativas?</legend>
            {[
              ['SEM_CONTAGEM', 'Estimei sem contar'], ['CONTAGEM_MENTAL', 'Contei mentalmente'],
              ['CONTAGEM_BIPES', 'Usei os bipes para contar'], ['COMBINADA', 'Combinei estratégias'],
              ['OUTRA', 'Outra'], ['pular', 'Prefiro não responder'],
            ].map(([valor, rotulo]) => <label key={valor} className="flex min-h-12 items-center gap-3"><input type="radio" name="estrategia" value={valor} checked={estrategia === valor} onChange={e => definirEstrategia(e.target.value)} />{rotulo}</label>)}
          </fieldset>
          <label className="block">Comentário opcional (até 300 caracteres)
            <textarea maxLength={300} value={comentario} onChange={e => definirComentario(e.target.value)} className="block w-full border border-borda-controle rounded-lg p-3 mt-2" />
          </label>
        </>}
    </fieldset>
    <button type="submit" disabled={!completo || ocupado} className="min-h-12 rounded-xl bg-destaque text-principal font-semibold px-6 py-3 disabled:opacity-50">{ocupado ? 'Confirmando respostas...' : 'Continuar'}</button>
  </form>;
}
