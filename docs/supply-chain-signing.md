# Supply Chain Signing dengan cosign

Panduan ini menjelaskan cara pipeline menandatangani image, melampirkan SBOM sebagai attestation,
dan menolak deploy jika tanda tangan tidak valid.

## 1. Alur di Jenkinsfile

| Stage | Kondisi jalan | Yang dilakukan |
| :--- | :--- | :--- |
| **Push Images** | `main`, bukan PR | Push `:git-sha` dan `:latest`, lalu simpan **digest** ke `test_reports/supply-chain/<image>.digest` |
| **Sign & Attest (cosign)** | `main`, bukan PR | `cosign sign` per digest (anotasi `git-sha`, `build`) dan `cosign attest --type cyclonedx` dengan SBOM dari Trivy |
| **Verify Signatures** | `main` + `DEPLOY=true` | Gagal jika `cosign.pub` masih placeholder; `cosign verify --key cosign.pub -a git-sha=<sha>` dan `cosign verify-attestation --type cyclonedx` |
| **Deploy to Kubernetes** | `main` + `DEPLOY=true` | Manifest di-pin ke digest yang lolos verifikasi; build gagal jika masih ada image `:latest` |

Kenapa digest, bukan tag: tag bisa dipindah ke image lain, digest tidak. Tanda tangan, verifikasi, dan
deploy memakai referensi `ghcr.io/0xshalah/<image>@sha256:...` yang sama persis.

Mode yang dipakai adalah **key pair** (bukan keyless), karena Jenkins tidak punya identitas OIDC
seperti GitHub Actions. Secara default cosign v2 juga mencatat tanda tangan ke transparency log
publik Rekor (sigstore), sehingga agent Jenkins butuh akses internet ke `rekor.sigstore.dev`.

## 2. Membuat key pair (sekali, di mesin pemilik repo)

```bash
# cosign v2: https://docs.sigstore.dev/cosign/system_config/installation/
cosign generate-key-pair
# menghasilkan cosign.key (private, terenkripsi password) dan cosign.pub (public)
```

- `cosign.pub` → **commit** ke root repository, menggantikan placeholder yang ada.
- `cosign.key` → **jangan pernah di-commit** (sudah ada di `.gitignore`). Simpan sebagai kredensial Jenkins.

## 3. Kredensial Jenkins

Manage Jenkins › Credentials › (global) › Add Credentials:

| ID | Jenis | Isi |
| :--- | :--- | :--- |
| `cosign-private-key` | Secret file | file `cosign.key` |
| `cosign-password` | Secret text | password yang dipakai saat `generate-key-pair` |
| `registry-creds` | Username with password | user GHCR + token dengan scope `write:packages` (sudah dipakai stage push) |

Agent Jenkins membutuhkan binary `cosign` v2 di `PATH`.

## 4. Verifikasi manual

```bash
REF=ghcr.io/0xshalah/tollgate-backend@sha256:<digest>   # dari test_reports/supply-chain/tollgate-backend.digest

# tanda tangan + anotasi commit
cosign verify --key cosign.pub -a git-sha=<12-char-sha> "$REF" | jq .

# attestation SBOM (CycloneDX)
cosign verify-attestation --key cosign.pub --type cyclonedx "$REF" \
  | jq -r .payload | base64 -d | jq '.predicate.components | length'

# melihat artefak yang menempel di image (signature, attestation)
cosign tree "$REF"
```

Uji negatif yang disarankan untuk laporan: verifikasi image yang tidak ditandatangani (mis. build lokal
yang di-push manual) harus gagal dengan `no matching signatures`, dan stage *Verify Signatures* harus merah.

## 5. Rotasi key

1. `cosign generate-key-pair` baru, ganti `cosign.pub` di repo dan kredensial `cosign-private-key` / `cosign-password`.
2. Jalankan pipeline ulang agar image terbaru ditandatangani dengan key baru.
3. Image lama yang hanya bertanda tangan key lama tidak akan lolos *Verify Signatures* lagi.

## 6. Batasan saat ini

- Verifikasi baru ditegakkan **di pipeline**. Cluster belum menolak image tanpa tanda tangan yang di-apply
  manual; rencana Fase 3: admission policy (mis. Kyverno `verifyImages`) dengan `cosign.pub` yang sama.
- Tahap ini belum pernah dijalankan di Jenkins sungguhan (lihat [`evidence-report.md`](./evidence-report.md)).
