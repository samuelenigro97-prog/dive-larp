# DESIGN.md — DIVE Cyberpunk LARP HUD System

## Identity & Direction
- **Product:** DIVE — Live Action Roleplay Cyberpunk Companion App.
- **Visual Direction:** Authentic Militech / Cyberpunk 2077 Hardware Terminal HUD. Sharp, tactile, industrial, non-templated.
- **Anti-Slop Commitment:** Zero generic SaaS `rounded-3xl` bubbles, zero emoji decoration in UI controls, zero rainbow neon soup, zero frosted glassmorphism on scrolling cards.

## Palette
- **Base Obsidian:** `#04060A`
- **Panel Matte Carbon:** `#080B12`
- **Inner Slot Surface:** `#0D121D`
- **Primary Brand Accent:** `#FF6600` (DIVE Signal Orange — used strictly for active navigation, primary CTA, and brand identity)
- **Tech / Optical Accent:** `#00F0FF` (Kiroshi Cyan — used for scanner, netrunning, and telemetry)
- **Alert / Trauma Accent:** `#FF2A4B` (Trauma Red — used for critical HP, ICE alarms, and combat override)
- **Nominal / Credits:** `#00E676` (EuroDollar Green — used strictly for wallet balance and nominal HP)

## Geometry & Radii
- **Panels:** Chamfered 45-degree corner cuts (`clip-path: polygon(...)`) or `2px` industrial corners.
- **Inputs & Buttons:** `2px` to `4px` technical radii (`rounded-sm`), never `rounded-full` pills on action buttons or cards.

## Typography
- **Display / Titles:** `Orbitron` (weights 700, 900)
- **Telemetry / Codes / Labels:** `Share Tech Mono`
- **Body / Lore / Chat:** `Space Grotesk`
