# Arquitetura do frontend

## Estrutura

```
src/
  main.jsx                 # entry
  app/                     # shell: App, providers, rotas
  features/                # domínios de negócio
    auth/
    setores/
    funcionarios/
    organograma/
    referencias/
    dashboard/
    users/
  shared/                  # código transversal
    api/                   # HTTP client + endpoints
    layout/                # Header, shells
    context/               # TenantContext
    theme/                 # design tokens
    styles/
    lib/
```

## Aliases (vite.config.js)

| Alias | Path |
|-------|------|
| `@` | `src/` |
| `@app` | `src/app` |
| `@features` | `src/features` |
| `@shared` | `src/shared` |

Exemplo: `import { useAuth } from '@features/auth'`

## Como adicionar uma feature

1. Criar `src/features/<nome>/{components,hooks,index.js}`
2. Exportar pelo `index.js` (barrel)
3. Registrar rota em `src/app/App.jsx`
4. Se precisar de API, adicionar em `src/shared/api/`
