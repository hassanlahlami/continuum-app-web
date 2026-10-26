# continuum-app-web

Front de la **Plateforme Fonctionnelle** (Angular). Développement **front-first piloté par contrat** (D32) :
le client TypeScript est **généré** depuis les contrats OpenAPI, jamais écrit à la main.

## Client API généré

Le client est généré depuis la spec **bundlée** (redocly) du module `me` et **n'est pas commité**
(`libs/api-clients/*/` est git-ignoré, D32) :

```bash
npm install
npm run generate:me        # libs/api-clients/me (spec bundlée du backend)
npm run generate:missions  # bundle redocly (@redocly/cli, devDependency) puis client missions
npm run generate:findings  # idem pour les constats
npm run generate:ccm       # spec bundlée du backend
npm run typecheck       # tsc --noEmit sur le client généré
```

- Source du contrat : `../Instructions/contracts/openapi/app/me.yaml` (dépôt `instructions`).
- La spec bundlée consommée est `../continuum-backend/src/main/openapi/me.bundled.yaml` (bundle redocly
  qui préserve les noms des schémas partagés de `common.yaml`).

## À venir
Espace de travail Nx (app + e2e), MSW (mocks), coquille applicative, vague 1 de pages (§8.6, D36).
Prérequis : Node ≥ 20.
