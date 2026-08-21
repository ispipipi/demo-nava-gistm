import { FormEvent, useEffect, useRef, useState } from "react";
import { replyToMentat, MentatDataBlock, MentatReply } from "../lib/mentat";
import { Proyecto } from "../types";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
  source?: string;
  blocks?: MentatReply["blocks"];
};

const initialMessage: ChatMessage = {
  id: 1,
  role: "assistant",
  text: "Hola, soy Mentat. Puedo responder preguntas sobre avances, criterios, subcriterios, brechas y fichas del proyecto Nava.",
  source: "Mentat · datos Nava conectados"
};

function MentatAvatar({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`mentat-avatar ${compact ? "mentat-avatar--compact" : ""}`} aria-hidden="true">
      <span className="mentat-avatar__halo" />
      <span className="mentat-avatar__face">
        <span />
        <span />
      </span>
      <span className="mentat-avatar__mark">M</span>
    </span>
  );
}

function renderMessageText(text: string) {
  return text.split("\n").map((line, index) => (
    <span key={`${line}-${index}`} className="block">
      {line}
    </span>
  ));
}

function MentatDataBlocks({ blocks }: { blocks: MentatDataBlock[] }) {
  return (
    <div className="mentat-data-blocks">
      {blocks.map((block, index) =>
        block.type === "bars" ? (
          <section key={`${block.type}-${index}`} className="mentat-data-card" aria-label={block.title}>
            <div className="mentat-data-card__heading">
              <strong>{block.title}</strong>
              <span>{block.valueLabel}</span>
            </div>
            <div className="mentat-bars">
              {block.items.map((item) => (
                <div key={item.label} className="mentat-bar-row">
                  <div className="mentat-bar-label">
                    <span title={item.label}>{item.label}</span>
                    <strong>{item.displayValue}</strong>
                  </div>
                  <div className="mentat-bar-track">
                    <span
                      className="mentat-bar-fill"
                      style={{ width: `${Math.max(4, Math.min(100, (item.value / block.maxValue) * 100))}%`, backgroundColor: item.fill }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section key={`${block.type}-${index}`} className="mentat-data-card" aria-label={block.title}>
            <div className="mentat-data-card__heading">
              <strong>{block.title}</strong>
              <span>Detalle</span>
            </div>
            <div className="mentat-table-wrap">
              <table className="mentat-table">
                <thead>
                  <tr>
                    {block.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`${row[0] ?? rowIndex}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${cell}-${cellIndex}`} className={cellIndex === 2 ? "mentat-table__label" : ""}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      )}
    </div>
  );
}

export function MentatCopilot({ project }: { project: Proyecto }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, open]);

  function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const answer = replyToMentat(trimmed, project);
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: trimmed },
      { id: Date.now() + 1, role: "assistant", ...answer }
    ]);
    setQuery("");
  }

  function submitQuestion(event: FormEvent) {
    event.preventDefault();
    ask(query);
  }

  function askSuggestedQuestion(value: string) {
    ask(value);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <>
      {!open && (
        <button type="button" className="mentat-launcher" aria-label="Abrir Mentat" onClick={() => setOpen(true)}>
          <MentatAvatar compact />
          <span>
            <strong>Mentat</strong>
            <small>Datos GISTM</small>
          </span>
          <span className="mentat-spark" aria-hidden="true">
            ✦
          </span>
        </button>
      )}

      {open && (
        <section className="mentat-panel" role="dialog" aria-modal="false" aria-label="Chat de Mentat">
          <header className="mentat-panel__header">
            <div className="flex min-w-0 items-center gap-3">
              <MentatAvatar />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-white">Mentat</p>
                <p className="mt-0.5 truncate text-[11px] text-white/60">Copiloto GISTM · Excel Nava</p>
              </div>
            </div>
            <button type="button" className="mentat-close" aria-label="Cerrar Mentat" onClick={() => setOpen(false)}>
              ×
            </button>
          </header>

          <div className="mentat-panel__context">
            <span className="h-1.5 w-1.5 rounded-full bg-[#45d596]" />
            {project.cliente} · {project.brechas.length} relaciones · {project.evidencias.length} evidencias
          </div>

          <div ref={scrollRef} className="mentat-panel__messages" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`mentat-message ${message.role === "user" ? "mentat-message--user" : ""}`}>
                {message.role === "assistant" && <MentatAvatar compact />}
                <div className="min-w-0 max-w-[calc(100%-42px)]">
                  <div className="mentat-bubble">{renderMessageText(message.text)}</div>
                  {message.blocks && <MentatDataBlocks blocks={message.blocks} />}
                  {message.source && <div className="mentat-source">{message.source}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="mentat-panel__suggestions">
            <span>Sugerencias</span>
            <div>
              <button type="button" onClick={() => askSuggestedQuestion("Cual es el % de avance del criterio 1")}>
                Criterio 1
              </button>
              <button type="button" onClick={() => askSuggestedQuestion("Que brechas tiene 2.2")}>
                Brechas 2.2
              </button>
              <button type="button" onClick={() => askSuggestedQuestion("Cuantas brechas abiertas hay")}>
                Brechas abiertas
              </button>
            </div>
          </div>

          <form className="mentat-panel__form" onSubmit={submitQuestion}>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pregunta por un dato del proyecto..."
              aria-label="Pregunta a Mentat"
            />
            <button type="submit" aria-label="Enviar pregunta" disabled={!query.trim()}>
              ↑
            </button>
          </form>
        </section>
      )}
    </>
  );
}
