# Laporan Bukti Pipeline DevSecOps

Ringkasan bukti per tahap pipeline [`jenkins/Jenkinsfile`](../jenkins/Jenkinsfile) untuk review mentor
dan lampiran laporan magang.

> **Penting: sumber bukti.** Semua hasil di bawah yang berlabel **LOKAL** dijalankan manual di
> workspace pengembangan pada **2026-11-07**, dengan perintah yang sama dengan Jenkinsfile.
> Hasil tersebut **bukan dari build Jenkins**. Tahap yang membutuhkan Docker daemon, registry, atau
> cluster masih berstatus **MENUNGGU JENKINS**, dengan kolom kosong untuk menempel bukti nanti.
> Temuan dicatat apa adanya dan belum diperbaiki.

File laporan mentah hasil lokal: [`docs/evidence/local/`](./evidence/local).
Saat dijalankan di Jenkins, laporan yang sama ditulis ke `test_reports/` dan diarsipkan sebagai artefak build.

---

## 1. Ringkasan per Tahap

| # | Tahap | Tool & perintah (sesuai Jenkinsfile) | Hasil | Gate | Sumber bukti | Status |
| :-: | :--- | :--- | :--- | :-: | :--- | :--- |
| 1 | Secret scan | `gitleaks detect --redact` (v8.21.2, 17 commit) | 1 temuan `generic-api-key` di `tests/test_auth.py:138` (false positive, lihat F-01) | ❌ | `evidence/local/gitleaks.sarif` | LOKAL |
| 2 | SAST Python | `bandit -r backend database -ll` (v1.9.4) | 0 medium/high · 2 low (di bawah ambang `-ll`) | ✅ | `evidence/local/bandit.json` | LOKAL |
| 3 | SAST multi-bahasa | `semgrep scan --config p/owasp-top-ten --config p/python --config p/react --error` (v1.184.0) | 221 rule, 149 file, **0 temuan** | ✅ | `evidence/local/semgrep.sarif` | LOKAL |
| 4 | SCA Python | `pip-audit -r backend/requirements.prod.txt --strict` (v2.10.1) | 23 paket, **2 rentan**: `starlette 0.37.2` (7 advisory), `pymongo 4.18.2` (1) | ❌ | `evidence/local/pip-audit.json` | LOKAL |
| 5 | SCA Node | `yarn audit --level high --groups dependencies` (yarn 1.22.22) | 1.500 paket: **11 high**, 15 moderate, 11 low, 0 critical | ❌ | `evidence/local/yarn-audit.jsonl` | LOKAL |
| 6 | Unit & security test | `pytest` (v9.2.0, xdist 2 worker, DB tes terisolasi) | **90/90 lulus**, coverage baris **96,3%** | ✅ | `evidence/local/pytest-junit.xml`, `evidence/local/coverage.xml` | LOKAL |
| 7 | SonarQube | `sonar-scanner-cli` | — | — | *(tempel URL dashboard / screenshot)* | MENUNGGU JENKINS |
| 8 | Build image | `docker build -f docker/{backend,frontend}.Dockerfile` | — | — | *(log build, ukuran image)* | MENUNGGU JENKINS |
| 9 | Image scan | `trivy image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1` | — | — | `test_reports/security/trivy-*.sarif` | MENUNGGU JENKINS |
| 10 | SBOM | `trivy image --format cyclonedx` | — | — | `test_reports/security/sbom-*.cdx.json` | MENUNGGU JENKINS |
| 11 | IaC scan | `trivy config --severity HIGH,CRITICAL --exit-code 1 docker k8s` | — | — | *(log stage)* | MENUNGGU JENKINS |
| 12 | Push | `docker push :git-sha` + simpan digest | — | — | `test_reports/supply-chain/*.digest` | MENUNGGU JENKINS |
| 13 | Sign & attest | `cosign sign` + `cosign attest --type cyclonedx` per digest | — | — | *(output `cosign tree <digest>`)* | MENUNGGU JENKINS |
| 14 | Verify signature | `cosign verify` + `cosign verify-attestation` dengan `cosign.pub` | — | — | `test_reports/supply-chain/verify-*.json` | MENUNGGU JENKINS |
| 15 | Deploy | `kubectl apply` manifest ter-pin digest + `rollout status` | — | — | *(output `kubectl get pods -n tollgate`)* | MENUNGGU JENKINS |
| 16 | DAST (opsional) | `zap-baseline.py` | — | — | `test_reports/security/zap-baseline.html` | MENUNGGU JENKINS |

**Implikasi**: dengan kondisi kode saat ini, build Jenkins pertama akan **berhenti di stage 2
(Secret Scan)**, dan setelah itu juga gagal di **SCA Python** dan **SCA Node**. Ini menunjukkan gate
bekerja sesuai desain; temuan di bawah perlu ditangani sebelum pipeline bisa hijau.

---

## 2. Daftar Temuan

| ID | Tahap | Tingkat | Temuan | Rekomendasi tindak lanjut |
| :--- | :--- | :--- | :--- | :--- |
| F-01 | Secret scan | Tinggi (memblokir pipeline) | `generic-api-key` di `tests/test_auth.py:138`: string `sk-gw-live-0123…` adalah token palsu untuk uji penolakan, bukan secret nyata (false positive). Commit `a87590fa`. | Tambah komentar `# gitleaks:allow` di baris tersebut atau `.gitleaks.toml` dengan allowlist path `tests/`; jangan menonaktifkan rule secara global. |
| F-02 | SCA Python | Tinggi | `starlette 0.37.2` (dependensi `fastapi 0.110.1`): 7 advisory (PYSEC-2026-1943, -1941, -161, -2280, -2281, -248, -249); fix tertinggi di 1.3.1. | Upgrade `fastapi` ke versi yang memakai `starlette ≥ 1.3.1`, jalankan ulang 90 tes. |
| F-03 | SCA Python | Sedang | `pymongo 4.18.2`: CVE-2026-106435, fix di 4.18.3. | Naikkan ke `pymongo ≥ 4.18.3` (patch release). |
| F-04 | SCA Node | Sedang | `axios › follow-redirects` (GHSA-q3jh-wrc6-jgq8 dan 2 advisory lain), runtime bundle. | Upgrade `axios` atau tambah `resolutions` `follow-redirects ≥ 1.16.1`. |
| F-05 | SCA Node | Sedang | `zod 3.24.4` (GHSA-mrhx-c7xc-m3w5, memory exhaustion), runtime. | Upgrade `zod` ke `≥ 4.6.6` dan cek kompatibilitas `@hookform/resolvers`. |
| F-06 | SCA Node | Rendah | Paket build-time lewat `react-scripts`: `body-parser`, `launch-editor`, `follow-redirects` (webpack-dev-server), `svgo` (@svgr). Tidak ikut ke image nginx. | `resolutions` untuk versi patched, atau dokumentasikan pengecualian berbasis risiko; jangka panjang migrasi dari CRA. |
| F-07 | SAST | Info | Bandit low: `B311` (`random`) dan `B105` di `database/seed.py` (data demo, bukan jalur keamanan). | Tidak perlu tindakan; boleh `# nosec` dengan alasan. |
| F-08 | Gate | Sedang | `yarn audit` tidak memisahkan dependensi runtime dan build-time karena CRA menaruh `react-scripts` di `dependencies`. | Pindahkan tooling build ke `devDependencies` agar `--groups dependencies` hanya menilai kode runtime. |

---

## 3. Pemetaan Kontrol

### 3.1 OWASP API Security Top 10 (2023) → bukti tes

| Risiko | Kontrol | Bukti (pytest, LOKAL 90/90) |
| :--- | :--- | :--- |
| API1 Broken Object Level Authorization | Query selalu di-scope `workspace_id`; objek asing → 404 identik | `tests/test_bola_bfla.py` (key, log, workspace, settings antar user) |
| API2 Broken Authentication | JWT HS256 dengan klaim wajib, lockout 5 gagal, anti user-enumeration, API key HMAC | `tests/test_auth.py`, `tests/test_gateway.py` |
| API3 Broken Object Property Level Authorization | Schema strict: field tambahan/privilese → 422 | `tests/test_bola_bfla.py` (BOPLA), `test_gateway_rejects_extra_fields` |
| API4 Unrestricted Resource Consumption | Rate limit sliding window per IP / key / workspace, 429 + `Retry-After` | `tests/test_rate_limit.py` |
| API5 Broken Function Level Authorization | RBAC Owner/Admin/Member/Viewer pada endpoint tulis | `tests/test_bola_bfla.py` (BFLA) |
| API8 Security Misconfiguration | Health tanpa bocor secret, `/metrics` wajib token saat dikonfigurasi | `tests/test_health.py` |
| API10 Unsafe Consumption of APIs | Guardrail input sebelum ke LLM upstream (injection, PII, toxicity) | `tests/test_gateway.py` |

### 3.2 Prinsip pipeline → kontrol → bukti

| Prinsip | Kontrol | Bukti |
| :--- | :--- | :--- |
| Shift-left | Secret scan, SAST, SCA, dan tes berjalan sebelum image dibangun | Tahap 1–6 (LOKAL) |
| Fail fast | `--exit-code 1`, `--strict`, `--error`, `--level high` | F-01..F-05 terbukti akan menggagalkan build |
| Immutable artifact | Digest dicatat saat push; sign, verify, deploy memakai digest yang sama; `:latest` ditolak di manifest | Tahap 12–15 (MENUNGGU JENKINS), [`supply-chain-signing.md`](./supply-chain-signing.md) |
| Supply chain integrity | Tanda tangan cosign + attestation SBOM CycloneDX, diverifikasi sebelum deploy | Tahap 13–14 (MENUNGGU JENKINS) |
| Least privilege | Container non-root, read-only FS, drop ALL capabilities, NetworkPolicy default-deny | `docker/*.Dockerfile`, `k8s/*.yaml`; dibuktikan `trivy config` (tahap 11) |
| Auditability | Semua laporan SARIF/JSON/JUnit/SBOM diarsipkan per build | Folder `test_reports/` di artefak Jenkins |

---

## 4. Cara Memperbarui Laporan Ini (Fase 2)

1. Jalankan pipeline di Jenkins pada branch `main` dengan `DEPLOY=true`.
2. Unduh artefak build (`test_reports/**`), salin ke `docs/evidence/jenkins/<build-number>/`.
3. Isi kolom *Hasil* dan *Sumber bukti* tahap 7–16, ubah status menjadi `JENKINS #<build>`.
4. Tambahkan screenshot (stage view Jenkins, `cosign tree`, `kubectl get pods`) ke `docs/assets/`.
5. Untuk tiap temuan yang diperbaiki, catat commit perbaikan di kolom rekomendasi.
