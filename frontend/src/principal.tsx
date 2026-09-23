// principal.tsx — Ponto de entrada da aplicação React

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './estilos.css'
import { Aplicacao } from './Aplicacao'

const raiz = document.getElementById('raiz')
if (!raiz) throw new Error('Elemento #raiz não encontrado no DOM')

createRoot(raiz).render(
  <StrictMode>
    <BrowserRouter>
      <Aplicacao />
    </BrowserRouter>
  </StrictMode>,
)
