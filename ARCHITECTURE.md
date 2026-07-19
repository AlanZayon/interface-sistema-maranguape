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
    cargos/
    tenants/               # console master (superadmin)
  shared/                  # código transversal
    api/                   # HTTP client + endpoints
    layout/                # Header, shells
    context/               # TenantContext
    theme/                 # design tokens
    styles/
    lib/                   # tenant subdomain helpers
```

## Multi-tenant (frontend)

- Slug: subdomínio (`{slug}.BASE_DOMAIN` / `{slug}.localhost`)
- Master: `master.BASE_DOMAIN` → console `/tenants`
- Header `X-Tenant-Slug` + opcional `X-Act-As-Tenant`
- Branding via CSS variables em `TenantContext` / `applyBrandingVars` (`--brand-*`, `--header-*`, `--sidebar-*`, `--brand-secondary`)
- Custom CSS injetado em `#tenant-custom-css` (sanitizado/limitado pela API)
- Policy: `GET /api/tenants/branding-policy` — wizard/detail escondem campos conforme `TENANT_*` envs
- Preview multi-superfície: Login / Shell / Dashboard em `features/tenants` (classes reais do shell)
- Dev fallback: `?tenant=` ou `VITE_TENANT_SLUG`

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
