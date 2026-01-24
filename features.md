# Propostas de Novas Features - Next Stop

Baseado na análise do código atual, o "Next Stop" já possui uma base sólida com Kanban, Mapas (MapLibre), e Sincronização em Tempo Real. Abaixo estão propostas de novas features focadas em elevar o nível da ferramenta para um planejador de viagens completo.

## 1. 🌤️ Previsão do Tempo Integrada
O clima define o roteiro.
- **Implementação:** Usar a data e localização do card/dia para buscar a previsão (API OpenMeteo ou similar).
- **UI:** Ícone de sol/chuva e temperatura no cabeçalho da Coluna do Dia.

## 2. 📎 Anexos e Documentos
Centralizar tickets e reservas.
- **Implementação:** Integração com Firebase Storage para upload de PDFs/Imagens.
- **UI:** Área de drag-and-drop no `EditCardDialog` para anexar arquivos.

## 3. 🗳️ Votação em Grupo
Facilitar decisões em viagens com amigos.
- **Implementação:** Permitir que usuários "votem" em cards (especialmente útil na feature de "Opções").
- **UI:** Botão de "Like/Voto" no card e contador visual.

## 4. 🤖 Assistente de Viagem AI
Ajudar a preencher lacunas no roteiro.
- **Implementação:** Integração com LLM (OpenAI/Gemini) para sugerir atividades baseadas na localização e hora de um card existente.
- **UI:** Botão "Sugerir o que fazer depois" no card ou no dashboard.

## 5. 📱 Modo Offline (PWA)
Essencial para viagens sem internet constante.
- **Implementação:** Melhorar o caching do Service Worker e persistência local (IndexedDB) para permitir visualização/edição offline com sync posterior.
- **UI:** Indicador de "Offline" e "Sincronizando".

## 6. 🌍 Publicação de Roteiro
Compartilhar a viagem com quem não tem conta.
- **Implementação:** Gerar link público readonly para um Board.
- **UI:** Botão "Publicar" que gera uma URL compartilhável e uma view simplificada para visitantes.

---

# ✅ Implementado

## 📄 Exportar Relatório PDF
Levar o roteiro impresso ou em PDF para segurança.
- **Implementação:** Gerar um documento PDF formatado com cronograma, custos e checklists usando `jspdf` ou `react-pdf`.
- **UI:** Botão "Exportar PDF" nas configurações da viagem.

## 💰 Gestão de Orçamento
Atualmente, não há como rastrear custos. Adicionar um campo de valor em cada card permitiria uma visão financeira da viagem.
- **Implementação:** Adicionar campo `cost` e `currency` ao modelo `Card`.
- **UI:** Input monetário no `EditCardDialog` e somatórios automáticos no topo de cada dia (coluna) e um totalizador geral da viagem no Dashboard.

## ✅ Checklists Internos (Sub-tarefas)
Muitas atividades requerem passos prévios (ex: "Visita ao Museu" -> "Comprar ingresso", "Levar passaporte").
- **Implementação:** Adicionar array de `checklist` ao `Card`.
- **UI:** Barra de progresso visual no card e lista de itens marcáveis dentro do `EditCardDialog`.
