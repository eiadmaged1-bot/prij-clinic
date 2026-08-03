# Security Policy

## Supported code

Only the repository owner may approve and merge changes into the canonical Prij Clinic repository.

## Reporting a vulnerability

Do not open a public issue containing patient data, credentials, tokens, private URLs, database details, or exploit instructions.

Report security concerns privately to the repository owner through GitHub's private vulnerability reporting feature when enabled.

Include:

- affected component;
- reproduction steps using synthetic data only;
- expected and actual behaviour;
- impact assessment;
- suggested remediation, when available.

## Data safety

This repository must not contain production patient data, database exports, environment files, access tokens, passwords, private keys, signed URLs, or live service credentials.

All tests must use synthetic or anonymised fixtures. No workflow may reset, seed, truncate, migrate, delete, or otherwise mutate production data unless explicitly approved by the repository owner.

## Change control

Changes to the canonical repository must use an isolated branch and pull request, pass required automated checks, and receive repository-owner approval. Force pushes and branch deletion must be prohibited on protected branches.
