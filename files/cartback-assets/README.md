# Cartback Brand Assets

## 📦 Conteúdo do Pacote

```
cartback-assets/
├── app-icons/           # Ícones para iOS App Store
│   ├── icon-1024x1024.png    # App Store
│   ├── icon-180x180.png      # iPhone @3x
│   ├── icon-167x167.png      # iPad Pro @2x
│   ├── icon-152x152.png      # iPad @2x
│   ├── icon-120x120.png      # iPhone @2x / Spotlight @3x
│   └── ...                   # Todos os tamanhos iOS
│
├── favicons/            # Favicons para web
│   ├── favicon.svg           # Favicon vetorial
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png  # iOS Safari
│   ├── android-chrome-*.png  # Android PWA
│   ├── mstile-150x150.png    # Windows
│   ├── site.webmanifest      # PWA manifest
│   ├── browserconfig.xml     # Windows config
│   └── favicon-implementation.html
│
├── logos/               # Logos e wordmarks
│   ├── logo-horizontal.svg       # Fundo claro
│   ├── logo-horizontal-dark.svg  # Fundo escuro
│   ├── logo-vertical.svg         # Versão empilhada
│   ├── icon-mono-white.svg       # Ícone branco
│   └── icon-mono-black.svg       # Ícone preto
│
└── social/              # Redes sociais
    └── og-image.svg     # Open Graph 1200x630
```

---

## 🎨 Paleta de Cores

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| Verde Principal | `#25D366` | 37, 211, 102 | CTAs, destaques |
| Verde Escuro | `#128C7E` | 18, 140, 126 | Gradientes, hover |
| Cinza Escuro | `#1A1A2E` | 26, 26, 46 | Textos |
| Branco | `#FFFFFF` | 255, 255, 255 | Fundos |

### Gradiente Principal
```css
background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
```

---

## 📱 App Icons (iOS)

### Tamanhos Necessários

| Uso | Tamanho | Arquivo |
|-----|---------|---------|
| App Store | 1024×1024 | `icon-1024x1024.png` |
| iPhone @3x | 180×180 | `icon-180x180.png` |
| iPhone @2x | 120×120 | `icon-120x120.png` |
| iPad Pro @2x | 167×167 | `icon-167x167.png` |
| iPad @2x | 152×152 | `icon-152x152.png` |
| iPad @1x | 76×76 | `icon-76x76.png` |
| Settings @3x | 87×87 | `icon-87x87.png` |
| Settings @2x | 58×58 | `icon-58x58.png` |
| Spotlight @2x | 80×80 | `icon-80x80.png` |
| Spotlight @1x | 40×40 | `icon-40x40.png` |

### No Xcode
1. Abra Assets.xcassets
2. Selecione AppIcon
3. Arraste os PNGs para os slots correspondentes

---

## 🌐 Favicons (Web)

### Implementação HTML

Cole no `<head>` do seu HTML:

```html
<!-- Favicon básico -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- PWA -->
<link rel="manifest" href="/site.webmanifest">

<!-- Windows -->
<meta name="msapplication-TileColor" content="#25D366">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Theme -->
<meta name="theme-color" content="#25D366">
```

### Arquivos no Root
Copie para a raiz do seu site:
- `favicon.svg`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `mstile-150x150.png`
- `site.webmanifest`
- `browserconfig.xml`

---

## 🏷️ Logos

### Qual usar?

| Situação | Arquivo |
|----------|---------|
| Site header (fundo claro) | `logo-horizontal.svg` |
| Site header (fundo escuro) | `logo-horizontal-dark.svg` |
| Favicon grande / Avatar | `logo-vertical.svg` |
| Watermark em fundo colorido | `icon-mono-white.svg` |
| Impressão P&B | `icon-mono-black.svg` |

---

## 📣 Social Media

### Open Graph Image
- **Tamanho**: 1200×630px
- **Uso**: Facebook, LinkedIn, Twitter
- **Arquivo**: `social/og-image.svg`

### Meta Tags
```html
<meta property="og:image" content="https://cartback.app/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://cartback.app/og-image.png">
```

---

## ✅ Checklist de Implementação

- [ ] App Icons no Xcode/Android Studio
- [ ] Favicons no root do site
- [ ] site.webmanifest configurado
- [ ] Meta tags Open Graph
- [ ] Logo no header do site
- [ ] Logo no footer
- [ ] Logo em emails transacionais

---

## 🔗 Recursos

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Apple Design Resources](https://developer.apple.com/design/resources/)
- [Favicon Generator](https://realfavicongenerator.net/)

---

## 📝 Tipografia Recomendada

**Fonte Principal**: Inter
- [Download Inter](https://fonts.google.com/specimen/Inter)

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

---

*Cartback Brand Assets v1.0*
*Gerado seguindo Apple Human Interface Guidelines*
