# Specification Quality Checklist: Sandbox isolée & « make it real »

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-06-17
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Source de vérité : `rsrc/DescriptionProjet.md` §10.2 (reproduction manuelle = sandbox uniquement),
  §10.3 (sandbox + « make it real »), §6.8 (création/édition manuelle), §8.4 (écran sandbox), §6.6
  (couples/divorce), §6.7 (mort). Périmètre du plan général (Feature 7).
- **Changement de comportement clé** : la reproduction manuelle **quitte la page principale** (elle n'y
  servait que de porte d'accès en l'absence de sandbox) et devient **exclusive à la sandbox**.
- **Isolation stricte** : aucune modification de sandbox n'affecte la population réelle avant « make it
  real » (énoncé en capitales par l'utilisateur ⇒ FR-004).
- **Points à confirmer en `/speckit-clarify`** : (1) sémantique précise de « make it real » (l'état
  sandbox devient l'état réel) ; (2) stratégie RNG « rejouer vs transférer » (plan-level) ; (3) définition
  exacte de « l'état de la population à une année » vis-à-vis des décès manuels (sans date).
- Aucun marqueur `[NEEDS CLARIFICATION]` ne subsiste (défauts raisonnables documentés en Assumptions).
